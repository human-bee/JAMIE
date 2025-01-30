import SwiftUI

struct CanvasView: View {
    @StateObject private var viewModel = CanvasViewModel()
    @GestureState private var dragOffset = CGSize.zero
    @State private var position = CGPoint(x: 0, y: 0)
    @State private var scale: CGFloat = 1.0
    @State private var magazineLayoutEnabled = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color(.windowBackgroundColor)
                    .edgesIgnoringSafeArea(.all)
                
                ScrollView([.horizontal, .vertical]) {
                    ZStack {
                        // Grid background
                        GridBackground()
                            .opacity(magazineLayoutEnabled ? 0.05 : 0.1)
                        
                        // Canvas elements
                        ForEach(viewModel.elements) { element in
                            CanvasElementView(element: element)
                                .position(x: element.position.x + position.x + dragOffset.width,
                                        y: element.position.y + position.y + dragOffset.height)
                                .scaleEffect(scale)
                        }
                    }
                    .frame(width: geometry.size.width * 2, height: geometry.size.height * 2)
                    .onChange(of: magazineLayoutEnabled) { newValue in
                        if newValue {
                            viewModel.applyMagazineLayout(in: geometry.size)
                        }
                    }
                }
            }
            .gesture(
                DragGesture()
                    .updating($dragOffset) { value, state, _ in
                        if !magazineLayoutEnabled {
                            state = value.translation
                        }
                    }
                    .onEnded { value in
                        if !magazineLayoutEnabled {
                            position.x += value.translation.width
                            position.y += value.translation.height
                        }
                    }
            )
            .gesture(
                MagnificationGesture()
                    .onChanged { value in
                        if !magazineLayoutEnabled {
                            scale = value
                        }
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
                    
                    Divider()
                    
                    // Magazine Layout Toggle
                    Button(action: {
                        withAnimation(.spring()) {
                            magazineLayoutEnabled.toggle()
                            if magazineLayoutEnabled {
                                // Reset transformations when enabling magazine layout
                                position = .zero
                                scale = 1.0
                            }
                        }
                    }) {
                        Image(systemName: magazineLayoutEnabled ? "text.justify" : "text.alignleft")
                            .foregroundColor(magazineLayoutEnabled ? .yellow : .primary)
                    }
                    .help(magazineLayoutEnabled ? "Disable Magazine Layout" : "Enable Magazine Layout")
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
    
    func applyMagazineLayout(in size: CGSize) {
        // Implementation of applyMagazineLayout method
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
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        switch element.type {
        case .text:
            if let text = element.content as? String {
                Text(text)
                    .padding()
                    .frame(maxWidth: 300)
                    .background(colorScheme == .dark ? Color(.windowBackgroundColor) : .white)
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
                .frame(width: 200, height: 200)
                .background(colorScheme == .dark ? Color(.windowBackgroundColor) : .white)
                .cornerRadius(8)
                .shadow(radius: 2)
            }
        case .chart:
            if let data = element.content as? Data,
               let payload = try? JSONDecoder().decode(ChartPayload.self, from: data) {
                payload.createChart()
                    .frame(width: 200, height: 200)
                    .background(colorScheme == .dark ? Color(.windowBackgroundColor) : .white)
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