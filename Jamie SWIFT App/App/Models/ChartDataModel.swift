import Foundation
import SwiftUI
import Charts

struct ChartDataModel: Identifiable, Codable {
    let id = UUID()
    let label: String
    let value: Double
}

struct ChartPayload: Codable {
    let type: ChartType
    let data: [ChartDataModel]
    let title: String?
    
    enum ChartType: String, Codable {
        case bar
        case line
        case pie
    }
}

// Extension to handle chart rendering
extension ChartPayload {
    @ViewBuilder
    func createChart() -> some View {
        VStack {
            if let title = title {
                Text(title)
                    .font(.headline)
            }
            
            switch type {
            case .bar:
                Chart {
                    ForEach(data) { item in
                        BarMark(
                            x: .value("Category", item.label),
                            y: .value("Value", item.value)
                        )
                    }
                }
            case .line:
                Chart {
                    ForEach(data) { item in
                        LineMark(
                            x: .value("Category", item.label),
                            y: .value("Value", item.value)
                        )
                    }
                }
            case .pie:
                Chart {
                    ForEach(data) { item in
                        SectorMark(
                            angle: .value("Value", item.value),
                            innerRadius: .ratio(0.618),
                            angularInset: 1.5
                        )
                        .foregroundStyle(by: .value("Category", item.label))
                    }
                }
            }
        }
        .frame(width: 300, height: 200)
        .padding()
    }
} 