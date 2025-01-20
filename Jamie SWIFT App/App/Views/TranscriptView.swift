import SwiftUI

struct TranscriptView: View {
    @Binding var transcript: String
    
    var body: some View {
        ScrollView {
            Text(transcript)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .textSelection(.enabled)
        }
        .background(Color(.textBackgroundColor))
        .cornerRadius(8)
        .padding()
    }
}

struct TranscriptView_Previews: PreviewProvider {
    static var previews: some View {
        TranscriptView(transcript: .constant("Sample transcript text..."))
    }
} 