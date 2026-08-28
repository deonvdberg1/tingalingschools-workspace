// DocChat OCR helper — macOS Vision-based text recognition.
// Usage: ocr <file> [pageStart] [pageEnd]
//   file:      PDF or image (png/jpg/jpeg/tiff)
//   pageStart: 1-based first page (PDF only, default 1)
//   pageEnd:   1-based last page inclusive (PDF only, default = pageCount)
// Outputs recognized text to stdout, one line per text line.
import Foundation
import PDFKit
import Vision

guard CommandLine.arguments.count > 1 else { exit(2) }
let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)

func ocrImage(_ cg: CGImage) -> String {
    var lines: [String] = []
    let sem = DispatchSemaphore(value: 0)
    let request = VNRecognizeTextRequest { req, _ in
        if let obs = req.results as? [VNRecognizedTextObservation] {
            lines = obs.compactMap { $0.topCandidates(1).first?.string }
        }
        sem.signal()
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-US"]
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([request])
    sem.wait()
    return lines.joined(separator: "\n")
}

let ext = url.pathExtension.lowercased()
if ext == "pdf" {
    guard let doc = PDFDocument(url: url) else { exit(3) }
    let count = doc.pageCount
    let start = CommandLine.arguments.count > 2 ? (Int(CommandLine.arguments[2]) ?? 1) : 1
    let end = CommandLine.arguments.count > 3 ? (Int(CommandLine.arguments[3]) ?? count) : count
    var out: [String] = []
    for p in max(1, start)...min(count, end) {
        guard let page = doc.page(at: p - 1) else { continue }
        let bounds = page.bounds(for: .mediaBox)
        // Render at ~2.5x for OCR accuracy
        let scale: CGFloat = 2.5
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        guard let cg = page.thumbnail(of: size, for: .mediaBox) as? CGImage else { continue }
        let text = ocrImage(cg)
        if !text.isEmpty { out.append(text) }
    }
    print(out.joined(separator: "\n\n"))
} else {
    // image
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { exit(3) }
    print(ocrImage(cg))
}
