import SwiftUI

class MagazineLayoutManager {
    static let shared = MagazineLayoutManager()
    private let goldenRatio: CGFloat = 1.618
    
    private init() {}
    
    func applyMagazineLayout(to elements: [CanvasElement], in size: CGSize) -> [CanvasElement] {
        var updatedElements = elements
        let columns = calculateOptimalColumns(for: elements.count)
        let (textElements, mediaElements) = separateElements(elements)
        
        // Layout text elements in a newspaper-style column format
        layoutTextElements(textElements, columns: columns, in: size, elements: &updatedElements)
        
        // Layout media elements (images, charts) in a balanced grid
        layoutMediaElements(mediaElements, in: size, elements: &updatedElements)
        
        return updatedElements
    }
    
    private func calculateOptimalColumns(for count: Int) -> Int {
        // Use golden ratio to determine optimal column count
        switch count {
        case 0...3: return 1
        case 4...8: return 2
        default: return 3
        }
    }
    
    private func separateElements(_ elements: [CanvasElement]) -> (text: [CanvasElement], media: [CanvasElement]) {
        let textElements = elements.filter { element in
            if case .text = element.type { return true }
            return false
        }
        
        let mediaElements = elements.filter { element in
            if case .text = element.type { return false }
            return true
        }
        
        return (textElements, mediaElements)
    }
    
    private func layoutTextElements(_ textElements: [CanvasElement], columns: Int, in size: CGSize, elements: inout [CanvasElement]) {
        let columnWidth = size.width / CGFloat(columns)
        let padding: CGFloat = 20
        
        for (index, element) in textElements.enumerated() {
            let column = index % columns
            let row = index / columns
            
            let x = columnWidth * CGFloat(column) + padding
            let y = (size.height / goldenRatio) * CGFloat(row) + padding
            
            if let elementIndex = elements.firstIndex(where: { $0.id == element.id }) {
                elements[elementIndex].position = CGPoint(x: x, y: y)
            }
        }
    }
    
    private func layoutMediaElements(_ mediaElements: [CanvasElement], in size: CGSize, elements: inout [CanvasElement]) {
        let padding: CGFloat = 20
        let mediaSize = CGSize(width: 200, height: 200)
        
        for (index, element) in mediaElements.enumerated() {
            // Create a balanced grid layout for media elements
            let row = index / 2
            let column = index % 2
            
            let x = size.width - (mediaSize.width + padding) * CGFloat(column + 1)
            let y = padding + mediaSize.height * CGFloat(row)
            
            if let elementIndex = elements.firstIndex(where: { $0.id == element.id }) {
                elements[elementIndex].position = CGPoint(x: x, y: y)
            }
        }
    }
}

// Extension to CanvasViewModel to integrate magazine layout
extension CanvasViewModel {
    func applyMagazineLayout(in size: CGSize) {
        let updatedElements = MagazineLayoutManager.shared.applyMagazineLayout(to: elements, in: size)
        DispatchQueue.main.async {
            self.elements = updatedElements
        }
    }
} 