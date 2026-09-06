import SwiftUI
import WidgetKit

// Doit rester identique à l'App Group déclaré dans app.json et
// expo-target.config.js, ainsi qu'à APP_GROUP dans src/lib/widget.ts.
let appGroup = "group.com.benjamin.kcal"
let snapshotKey = "snapshot"

/// Instantané écrit par l'app React Native à chaque changement de journal.
struct Snapshot: Codable {
  var caloriesConsumed: Int
  var caloriesGoal: Int
  /// Tampon de bruit au-delà de l'objectif : en dessous, pas de dette, pas
  /// de signal négatif — même logique que `CalorieRing.tsx` côté app.
  var caloriesBuffer: Int
  var proteinConsumed: Double
  var proteinGoal: Int
  /// Jour au format `YYYY-MM-DD`, pour détecter un instantané périmé.
  var day: String

  static let placeholder = Snapshot(
    caloriesConsumed: 760,
    caloriesGoal: 2000,
    caloriesBuffer: 200,
    proteinConsumed: 68,
    proteinGoal: 140,
    day: ""
  )

  var caloriesRemaining: Int { caloriesGoal - caloriesConsumed }
  /// Ce qu'il reste avant qu'un vrai dépassement (au-delà du tampon) ne
  /// compte pour de la dette — la question "jusqu'où je peux aller ?".
  var margin: Int { caloriesGoal + caloriesBuffer - caloriesConsumed }
  var inBuffer: Bool { caloriesRemaining < 0 && margin >= 0 }
  var overBuffer: Bool { margin < 0 }
  /// Un vrai dépassement, jamais un simple bruit de journée — jamais de rouge non plus.
  var isOver: Bool { inBuffer || overBuffer }
  var proteinDone: Bool { proteinGoal > 0 && proteinConsumed >= Double(proteinGoal) }

  var calorieRatio: Double {
    guard caloriesGoal > 0 else { return 0 }
    return min(Double(caloriesConsumed) / Double(caloriesGoal), 1)
  }

  var proteinRatio: Double {
    guard proteinGoal > 0 else { return 0 }
    return min(proteinConsumed / Double(proteinGoal), 1)
  }
}

/// Aujourd'hui au même format que `toDayKey` côté JS (heure locale).
func localDayKey() -> String {
  let formatter = DateFormatter()
  formatter.dateFormat = "yyyy-MM-dd"
  formatter.timeZone = .current
  return formatter.string(from: Date())
}

func readSnapshot() -> Snapshot {
  guard
    let defaults = UserDefaults(suiteName: appGroup),
    let raw = defaults.string(forKey: snapshotKey),
    let data = raw.data(using: .utf8),
    let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data)
  else {
    return Snapshot(
      caloriesConsumed: 0, caloriesGoal: 0, caloriesBuffer: 0,
      proteinConsumed: 0, proteinGoal: 0, day: ""
    )
  }

  // Instantané d'un jour passé : la journée a redémarré à zéro.
  if snapshot.day != localDayKey() {
    var reset = snapshot
    reset.caloriesConsumed = 0
    reset.proteinConsumed = 0
    reset.day = localDayKey()
    return reset
  }

  return snapshot
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), snapshot: .placeholder)
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: Date(), snapshot: context.isPreview ? .placeholder : readSnapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // L'app rafraîchit explicitement le widget à chaque ajout ; ce rechargement
    // à minuit sert seulement à remettre les compteurs à zéro.
    let now = Date()
    let midnight = Calendar.current.nextDate(
      after: now, matching: DateComponents(hour: 0, minute: 0), matchingPolicy: .nextTime
    ) ?? now.addingTimeInterval(3600)

    completion(Timeline(entries: [Entry(date: now, snapshot: readSnapshot())], policy: .after(midnight)))
  }
}

// MARK: - Vues

/// Barre de progression fine, verte une fois l'objectif protéines atteint.
struct Bar: View {
  let ratio: Double
  let color: Color

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(Color.primary.opacity(0.12))
        Capsule().fill(color).frame(width: max(geo.size.width * ratio, ratio > 0 ? 4 : 0))
      }
    }
    .frame(height: 6)
  }
}

/// Ambre partagé avec `t.saving` côté app (theme.ts) : jamais de rouge, un
/// dépassement reste une info de budget, pas un verdict.
let amber = Color(red: 0.96, green: 0.65, blue: 0.14)

/// Anneau des calories restantes, même logique visuelle que `CalorieRing.tsx`
/// côté app : sous l'objectif, ce qu'il reste ; au-delà, la marge avant
/// qu'un dépassement ne compte vraiment (jamais de rouge, jamais "en trop").
struct CalorieRingView: View {
  let snapshot: Snapshot
  var size: CGFloat
  var strokeWidth: CGFloat = 12

  var body: some View {
    let color = snapshot.isOver ? amber : Color.primary
    let big = snapshot.caloriesRemaining >= 0
      ? snapshot.caloriesRemaining
      : (snapshot.overBuffer ? 0 : snapshot.margin)
    let label = snapshot.caloriesRemaining >= 0 ? "kcal restantes" : "kcal de marge"

    ZStack {
      Circle()
        .stroke(Color.primary.opacity(0.1), lineWidth: strokeWidth)

      Circle()
        .trim(from: 0, to: snapshot.calorieRatio)
        .stroke(color, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))

      VStack(spacing: 1) {
        Text("\(big)")
          .font(.system(size: size * 0.26, weight: .heavy, design: .rounded))
          .minimumScaleFactor(0.5)
          .lineLimit(1)
          .foregroundStyle(color)

        Text(label)
          .font(.system(size: max(size * 0.075, 9), weight: .semibold, design: .rounded))
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
          .frame(maxWidth: size * 0.7)
      }
    }
    .frame(width: size, height: size)
  }
}

/// Ligne compacte protéines, utilisée sous l'anneau (petit widget).
struct ProteinCompact: View {
  let snapshot: Snapshot

  var body: some View {
    HStack(spacing: 5) {
      Text("PROT.")
        .font(.system(size: 9, weight: .bold, design: .rounded))
        .foregroundStyle(.secondary)

      Text("\(Int(snapshot.proteinConsumed))/\(snapshot.proteinGoal) g")
        .font(.system(size: 11, weight: .bold, design: .rounded))
        .foregroundStyle(snapshot.proteinDone ? Color.green : Color.primary)

      if snapshot.proteinDone {
        Image(systemName: "checkmark.circle.fill")
          .font(.system(size: 10))
          .foregroundStyle(.green)
      }
    }
  }
}

struct ProteinBlock: View {
  let snapshot: Snapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack(spacing: 4) {
        Text("PROTÉINES")
          .font(.system(size: 10, weight: .bold, design: .rounded))
          .foregroundStyle(.secondary)
        if snapshot.proteinDone {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 10))
            .foregroundStyle(.green)
        }
      }

      Text("\(Int(snapshot.proteinConsumed)) / \(snapshot.proteinGoal) g")
        .font(.system(size: 15, weight: .bold, design: .rounded))
        .foregroundStyle(snapshot.proteinDone ? Color.green : Color.primary)

      Bar(ratio: snapshot.proteinRatio, color: snapshot.proteinDone ? .green : Color(red: 0.9, green: 0.33, blue: 0.24))
    }
  }
}

/// Bouton d'accès direct au scanner (widget moyen uniquement : le petit widget
/// n'accepte qu'une seule zone tactile, gérée par `widgetURL`).
struct ScanButton: View {
  var body: some View {
    Link(destination: URL(string: "kcal:///add/scan")!) {
      HStack(spacing: 6) {
        Image(systemName: "barcode.viewfinder").font(.system(size: 13, weight: .semibold))
        Text("Scanner").font(.system(size: 13, weight: .bold, design: .rounded))
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 9)
      .background(Color.primary.opacity(0.08), in: Capsule())
    }
  }
}

struct SmallView: View {
  let snapshot: Snapshot

  var body: some View {
    GeometryReader { geo in
      VStack(spacing: 8) {
        CalorieRingView(
          snapshot: snapshot,
          size: min(geo.size.width, geo.size.height - 24)
        )
        ProteinCompact(snapshot: snapshot)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    .widgetURL(URL(string: "kcal:///add/scan"))
  }
}

struct MediumView: View {
  let snapshot: Snapshot

  var body: some View {
    HStack(alignment: .center, spacing: 20) {
      GeometryReader { geo in
        CalorieRingView(
          snapshot: snapshot,
          size: min(geo.size.width, geo.size.height)
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      .frame(maxWidth: .infinity)

      VStack(alignment: .leading, spacing: 12) {
        ProteinBlock(snapshot: snapshot)
        Spacer(minLength: 0)
        ScanButton()
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

struct KcalWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  var entry: Entry

  var body: some View {
    Group {
      switch family {
      case .systemMedium: MediumView(snapshot: entry.snapshot)
      default: SmallView(snapshot: entry.snapshot)
      }
    }
    .containerBackground(for: .widget) { Color("$widgetBackground") }
  }
}

@main
struct KcalWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "KcalWidget", provider: Provider()) { entry in
      KcalWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Calories restantes")
    .description("Ce qu'il te reste aujourd'hui, et un accès direct au scanner.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
