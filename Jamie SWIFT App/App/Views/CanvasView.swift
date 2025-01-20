import SwiftUI

struct CanvasView: View {
    @StateObject private var viewModel = CanvasViewModel()
    @GestureState private var dragOffset = CGSize.zero
    @State private var position = CGPoint(x: 0, y: 0)
    @State private var scale: CGFloat = 1.0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color(.windowBackgroundColor)
                    .edgesIgnoringSafeArea(.all)
                
                ScrollView([.horizontal, .vertical]) {
                    ZStack {
                        // Grid background
                        GridBackground()
                            .opacity(0.1)
                        
                        // Canvas elements
                        ForEach(viewModel.elements) { element in
                            CanvasElementView(element: element)
                                .position(x: element.position.x + position.x + dragOffset.width,
                                        y: element.position.y + position.y + dragOffset.height)
                                .scaleEffect(scale)
                        }
                    }
                    .frame(width: geometry.size.width * 2, height: geometry.size.height * 2)
                }
            }
            .gesture(
                DragGesture()
                    .updating($dragOffset) { value, state, _ in
                        state = value.translation
                    }
                    .onEnded { value in
                        position.x += value.translation.width
                        position.y += value.translation.height
                    }
            )
            .gesture(
                MagnificationGesture()
                    .onChanged { value in
                        scale = value
                    }
            )
            .toolbar {
                ToolbarItemGroup {
                    Button(action: { viewModel.addTextElement(text: "") }) {
                        Image(systemName: "text.bubble")
                    }
                    Button(action: { viewModel.addImageElement(url: "") }) {
                        Image(systemName: "photo")
                    }
                    Button(action: { viewModel.addChartElement(data: [:]) }) {
                        Image(systemName: "chart.bar")
                    }
                }
            }
        }
    }
}

struct GridBackground: View {
    let gridSize: CGFloat = 50
    
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                // Vertical lines
                for x in stride(from: 0, through: geometry.size.width, by: gridSize) {
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: geometry.size.height))
                }
                
                // Horizontal lines
                for y in stride(from: 0, through: geometry.size.height, by: gridSize) {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: geometry.size.width, y: y))
                }
            }
            .stroke(Color.gray, lineWidth: 0.5)
        }
    }
}

class CanvasViewModel: ObservableObject {
    static let shared = CanvasViewModel()
    @Published var elements: [CanvasElement] = []
    
    func addTextElement(text: String, position: CGPoint? = nil) {
        let element = CanvasElement(
            type: .text,
            content: text,
            position: position ?? CGPoint(x: 100, y: 100)
        )
        DispatchQueue.main.async {
            self.elements.append(element)
        }
    }
    
    func addImageElement(url: String, position: CGPoint? = nil) {
        let element = CanvasElement(
            type: .image,
            content: url,
            position: position ?? CGPoint(x: 100, y: 100)
        )
        DispatchQueue.main.async {
            self.elements.append(element)
        }
    }
    
    func addChartElement(data: [String: Any], position: CGPoint? = nil) {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data)
            let payload = try JSONDecoder().decode(ChartPayload.self, from: jsonData)
            let element = CanvasElement(
                type: .chart,
                content: try JSONEncoder().encode(payload),
                position: position ?? CGPoint(x: 100, y: 100)
            )
            DispatchQueue.main.async {
                self.elements.append(element)
            }
        } catch {
            print("Failed to decode chart payload: \(error.localizedDescription)")
        }
    }
}

struct CanvasElement: Identifiable {
    let id = UUID()
    var type: ElementType
    var content: Any
    var position: CGPoint
}

enum ElementType {
    case text
    case image
    case chart
}

struct CanvasElementView: View {
    let element: CanvasElement
    
    var body: some View {
        switch element.type {
        case .text:
            if let text = element.content as? String {
                Text(text)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(8)
                    .shadow(radius: 2)
            }
        case .image:
            if let urlString = element.content as? String,
               let url = URL(string: urlString) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    Image(systemName: "photo")
                        .resizable()
                }
                .frame(width: 100, height: 100)
                .background(Color.white)
                .cornerRadius(8)
                .shadow(radius: 2)
            }
        case .chart:
            if let data = element.content as? Data,
               let payload = try? JSONDecoder().decode(ChartPayload.self, from: data) {
                payload.createChart()
                    .background(Color.white)
                    .cornerRadius(8)
                    .shadow(radius: 2)
            }
        }
    }
}

struct CanvasView_Previews: PreviewProvider {
    static var previews: some View {
        CanvasView()
    }
} 