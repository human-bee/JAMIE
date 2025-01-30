import SwiftUI

class MagazineLayoutManager {
    static let shared = MagazineLayoutManager()
    private let goldenRatio: CGFloat = 1.618
    private let defaultTextBlockHeight: CGFloat = 100 // Default height if we can't measure
    private let columnSpacing: CGFloat = 40
    
    private init() {}
    
    func applyMagazineLayout(to elements: [CanvasElement], in size: CGSize) -> [CanvasElement] {
        var updatedElements = elements
        let columns = calculateOptimalColumns(for: elements.count)
        let (textElements, mediaElements) = separateElements(elements)
        
        // Layout text elements in a newspaper-style column format
        layoutTextElementsInColumns(textElements, columns: columns, in: size, elements: &updatedElements)
        
        // Layout media elements (images, charts) in a balanced grid
        layoutMediaElements(mediaElements, in: size, elements: &updatedElements)
        
        return updatedElements
    }
    
    private func calculateOptimalColumns(for count: Int) -> Int {
        // Use golden ratio to determine optimal column count
        switch count {
        case 0...5: return 2  // Changed to always have at least 2 columns for text flow
        case 6...12: return 3
        default: return 4
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
    
    private func layoutTextElementsInColumns(_ textElements: [CanvasElement], columns: Int, in size: CGSize, elements: inout [CanvasElement]) {
        guard !textElements.isEmpty else { return }
        
        let columnWidth = (size.width - columnSpacing * CGFloat(columns + 1)) / CGFloat(columns)
        let maxColumnHeight = size.height * 0.8 // Use 80% of height as max column height
        
        var currentColumn = 0
        var currentY = columnSpacing
        
        for element in textElements {
            // Get or estimate element height
            let elementHeight = estimateElementHeight(element, columnWidth: columnWidth)
            
            // Check if we need to move to next column
            if currentY + elementHeight > maxColumnHeight {
                currentColumn += 1
                currentY = columnSpacing
                
                // If we've used all columns, reset to top of first column
                if currentColumn >= columns {
                    currentColumn = 0
                }
            }
            
            // Calculate position
            let x = columnSpacing + (columnWidth + columnSpacing) * CGFloat(currentColumn)
            
            // Update element position
            if let elementIndex = elements.firstIndex(where: { $0.id == element.id }) {
                elements[elementIndex].position = CGPoint(x: x, y: currentY)
            }
            
            // Update Y position for next element in this column
            currentY += elementHeight + 20 // Add some spacing between elements
        }
    }
    
    private func estimateElementHeight(_ element: CanvasElement, columnWidth: CGFloat) -> CGFloat {
        // In a real implementation, we might measure the actual text height
        // For now, use a simple estimation based on content length
        if case .text = element.type {
            if let text = element.content as? String {
                // Rough estimation: 1 line = ~20pt height, assume ~60 chars per line
                let numberOfLines = ceil(Double(text.count) / 60.0)
                return max(defaultTextBlockHeight, CGFloat(numberOfLines) * 20)
            }
        }
        return defaultTextBlockHeight
    }
    
    private func layoutMediaElements(_ mediaElements: [CanvasElement], in size: CGSize, elements: inout [CanvasElement]) {
        let padding: CGFloat = columnSpacing
        let mediaSize = CGSize(width: 200, height: 200)
        
        // Position media elements in the rightmost area
        for (index, element) in mediaElements.enumerated() {
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