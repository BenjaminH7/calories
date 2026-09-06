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
  var proteinConsumed: Double
  var proteinGoal: Int
  /// Jour au format `YYYY-MM-DD`, pour détecter un instantané périmé.
  var day: String

  static let placeholder = Snapshot(
    caloriesConsumed: 760,
    caloriesGoal: 2000,
    proteinConsumed: 68,
    proteinGoal: 140,
    day: ""
  )

  var caloriesRemaining: Int { caloriesGoal - caloriesConsumed }
  var isOver: Bool { caloriesRemaining < 0 }
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
      caloriesConsumed: 0, caloriesGoal: 0, proteinConsumed: 0, proteinGoal: 0, day: ""
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

struct CaloriesBlock: View {
  let snapshot: Snapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(snapshot.isOver ? "EN TROP" : "RESTANT")
        .font(.system(size: 10, weight: .bold, design: .rounded))
        .foregroundStyle(.secondary)

      Text("\(abs(snapshot.caloriesRemaining))")
        .font(.system(size: 34, weight: .heavy, design: .rounded))
        .minimumScaleFactor(0.6)
        .lineLimit(1)
        .foregroundStyle(snapshot.isOver ? Color.red : Color.primary)

      Text("kcal sur \(snapshot.caloriesGoal)")
        .font(.system(size: 11, weight: .medium, design: .rounded))
        .foregroundStyle(.secondary)

      Bar(ratio: snapshot.calorieRatio, color: snapshot.isOver ? .red : .primary)
        .padding(.top, 4)
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
    VStack(alignment: .leading, spacing: 10) {
      CaloriesBlock(snapshot: snapshot)
      Spacer(minLength: 0)
      ProteinBlock(snapshot: snapshot)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .widgetURL(URL(string: "kcal:///add/scan"))
  }
}

struct MediumView: View {
  let snapshot: Snapshot

  var body: some View {
    HStack(alignment: .top, spacing: 16) {
      CaloriesBlock(snapshot: snapshot)
        .frame(maxWidth: .infinity, alignment: .leading)

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
