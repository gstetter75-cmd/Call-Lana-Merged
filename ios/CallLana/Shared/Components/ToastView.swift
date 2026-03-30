import SwiftUI

/// Overlay toast notification with auto-dismiss.
struct ToastView: View {
    let message: String
    let type: ToastType

    enum ToastType {
        case success, error, info

        var icon: String {
            switch self {
            case .success: "checkmark.circle.fill"
            case .error:   "xmark.circle.fill"
            case .info:    "info.circle.fill"
            }
        }

        var tintColor: Color {
            switch self {
            case .success: .green
            case .error:   .red
            case .info:    .blue
            }
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: type.icon)
                .foregroundStyle(type.tintColor)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.clText)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: Capsule())
        .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
    }
}

// MARK: - Toast Modifier

/// View modifier that presents a toast overlay with auto-dismiss.
struct ToastModifier: ViewModifier {
    @Binding var toast: ToastData?

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let toast {
                    ToastView(message: toast.message, type: toast.type)
                        .padding(.top, 8)
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .onAppear {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                withAnimation(.easeOut(duration: 0.3)) {
                                    self.toast = nil
                                }
                            }
                        }
                }
            }
            .animation(.spring(duration: 0.4), value: toast != nil)
    }
}

/// Data model for toast presentation.
struct ToastData: Equatable {
    let message: String
    let type: ToastView.ToastType
    private let id = UUID()

    static func == (lhs: ToastData, rhs: ToastData) -> Bool {
        lhs.id == rhs.id
    }
}

extension View {
    /// Present a toast overlay. Set binding to `nil` to dismiss, or let it auto-dismiss after 3s.
    func toast(_ toast: Binding<ToastData?>) -> some View {
        modifier(ToastModifier(toast: toast))
    }
}

#Preview {
    Text("Inhalt")
        .overlay(alignment: .top) {
            VStack(spacing: 8) {
                ToastView(message: "Erfolgreich gespeichert", type: .success)
                ToastView(message: "Fehler beim Laden", type: .error)
                ToastView(message: "Neue Nachricht", type: .info)
            }
        }
}
