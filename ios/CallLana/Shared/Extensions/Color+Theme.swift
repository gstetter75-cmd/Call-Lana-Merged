import SwiftUI

extension Color {
    // MARK: - Brand Colors

    /// Primary purple (#7c3aed)
    static let clPurple = Color(red: 124/255, green: 58/255, blue: 237/255)

    /// Dark purple (#6d28d9)
    static let clPurpleDark = Color(red: 109/255, green: 40/255, blue: 217/255)

    // MARK: - Semantic Colors

    static let clGreen = Color.green
    static let clRed = Color.red
    static let clOrange = Color.orange

    // MARK: - Surface Colors (dark mode aware)

    /// Main background color
    static let clBackground = Color(light: Color(.systemBackground), dark: Color(.systemBackground))

    /// Card / elevated surface color
    static let clCard = Color(light: .white, dark: Color(.secondarySystemBackground))

    /// Primary text color
    static let clText = Color(light: Color(.label), dark: Color(.label))

    /// Secondary text color
    static let clTextSecondary = Color(light: Color(.secondaryLabel), dark: Color(.secondaryLabel))
}

// MARK: - Light/Dark Mode Initializer

extension Color {
    /// Creates a color that adapts to light and dark mode.
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(dark)
            default:
                return UIColor(light)
            }
        })
    }
}
