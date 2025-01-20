> Use this as a high-level reference for Swift’s core language features, types, concurrency, collections, interoperability, and best practices.

---

## Swift Language Fundamentals

Swift is a modern language for Apple platforms (iOS, macOS, etc.) that emphasizes type safety, performance, and expressive syntax.

### 1. Core Features
- **Type Inference**: Automatically detects variable types.  
- **Optionals**: Safely handle missing values without crashes.  
- **Closures**: Pass blocks of functionality as variables.  
- **Memory Safety**: Prevents unsafe operations by default.  
- **Error Handling**: Throwing and catching errors in a structured way.  
- **Interactive Development**: Swift Playgrounds and the REPL facilitate experimentation.

### 2. Syntax Example
```swift
var interestingNumbers = [
    "primes": [2, 3, 5, 7],
    "triangular": [1, 3, 6, 10]
]
for key in interestingNumbers.keys {
    interestingNumbers[key]?.sort(by: >)
}
```
- Dictionary with type inference and safe access (`?`).

### 3. Standard Library Foundation
- **Int** / **Double** / **String**: Core numeric and text types.  
- **Array** / **Dictionary**: Common collection structures.  
- Includes concurrency, regex, atomic operations, Objective-C/C++ interoperability, and actor-based distributed computing.

**Best Practice**: Prefer Swift’s syntax and safety features over Objective-C patterns for new Apple platform apps.

---

## Integer Types (Int)

Swift’s `Int` adapts to platform size (32-bit vs. 64-bit), always signed.

### 1. Core Characteristics
- 32-bit on 32-bit systems, 64-bit on 64-bit systems.  
- Signed integers can store negative and positive values.

### 2. Key Operations
```swift
let x = Int(42)
let y = Int("123") // Optional Int
let z = Int("ABC") // nil
let random = Int.random(in: 1...100)
Int.min // Minimum representable
Int.max // Maximum representable
```

### 3. Common Conversions
- **Int(3.14)** truncates to 3.  
- `Int(exactly:)` returns an optional if conversion might lose data.  
- `Int("123", radix: 16)` parses with custom base.

### 4. Safety Features
```swift
let (sum, didOverflow) = someInt.addingReportingOverflow(otherInt)
if didOverflow { /* Handle overflow */ }
```
Use overflow-checking operations for large values.

**Best Practice**: Use `Int` by default unless you need a specific size or `UInt`.

---

## Structures vs Classes

Swift provides **structures** (value types) and **classes** (reference types).

### 1. Default Choice: Structures
- Value semantics: copies on assignment.  
- Safer state management, often used in standard library (e.g., `String`, `Array`).

### 2. When to Use Classes
```swift
class DatabaseConnection {
    let connectionId: String
}
if connection1 === connection2 { /* same instance */ }
```
- For reference semantics, shared resources, or when you need Objective-C interoperability.  

### 3. Common Class Use Cases
- Shared resources (file handles, DB connections).  
- Object identity important.  
- Inheritance from Objective-C.

### 4. Structure Best Practices
```swift
struct Record {
    let id: Int
    var nickname: String
    mutating func updateNickname(_ new: String) {
        nickname = new
    }
}
```
Prefer protocols + structures over class inheritance where possible.

---

## Type Casting and Dynamic Types

Swift includes safe casting (`as?`) and forced casting (`as!`), plus bridging to Objective-C.

### 1. Working with `Any`
```swift
var x: Any = "hello"
let str = x as? String
let definite = x as! String // forced, can crash if wrong
```

### 2. Use Cases
- Casting from untyped APIs (e.g., `UserDefaults`).  
- Switch-based type checks in arrays of mixed `Any`.

### 3. Best Practices
- Prefer `as?` for safety; only use `as!` if guaranteed.  
- Consider enums/protocols for more structured type handling.

---

## Floating-Point Square Root Operations

Swift’s `Double` supports in-place (`formSquareRoot()`) or non-mutating (`squareRoot()`) square root.

```swift
var value = 16.0
value.formSquareRoot() // modifies to 4.0
let sr = 25.0.squareRoot() // returns 5.0
```
- Returns `NaN` for negative inputs.

**Best Practice**: Choose `formSquareRoot()` for in-place changes.

---

## Debugging and Reflection

### 1. Printing and Output
```swift
print("Hello")
debugPrint(object)
dump(object) // Deep introspection
```

### 2. Runtime Checks
```swift
assert(condition, "Message")
precondition(condition, "Message")
fatalError("Unrecoverable")
```

### 3. Custom Reflection
Implement `CustomReflectable` to customize object introspection.

**Best Practice**: Use `assert()` for development checks, `precondition()` for runtime invariants.

---

## Concurrency and Swift 6: Strict Data Race Prevention

### 1. Core Concept
- Swift 6 adds strict concurrency checks, catching data races at compile time.

### 2. Benefits
- Fewer crashes and data corruption.  
- More reliable concurrency.

### 3. Adoption
- Enable concurrency checking in Xcode build settings.  
- Upgrade modules gradually.

### 4. Best Practices
- Eliminate overlapping access to shared mutable state.  
- Use concurrency primitives (actors, structured concurrency).

---

## Dictionaries in Swift

### 1. Core Definition
- Key-value pairs with `Hashable` keys.  
- Fast, efficient lookups.

### 2. Creation and Access
```swift
var response = [200: "OK", 403: "Forbidden"]
response[301] = "Moved"
response[500] = nil // remove
```

### 3. Iteration
```swift
for (code, msg) in response {
    print("\(code): \(msg)")
}
```

### 4. Best Practices
- Use optional binding for safe value retrieval.  
- Remember dictionaries are unordered.

---

## Swift Standard Library: Core Components and Philosophy

1. **Purpose**: Foundational layer with numeric types, collections, concurrency, reflection, etc.  
2. **Key Components**: `Int`, `Double`, `String`, `Array`, `Dictionary`, `Set`, plus global utilities.  
3. **Design Philosophy**: Safe, high-performance primitives, compile-time type safety, minimal boilerplate.

**Best Practice**: Leverage standard library protocols and types before reinventing solutions.

---

## Task Cancellation Handling in Swift

### 1. Purpose
`withTaskCancellationHandler` runs a cleanup when a task is canceled, even if the main task doesn’t check cancellation.

```swift
await withTaskCancellationHandler {
    // long-running async
} onCancel: {
    // immediate cleanup
}
```

### 2. Key Behaviors
- Handler runs immediately upon cancellation.  
- Works even if main operation ignores cancellation.

**Best Practice**: Use for guaranteed cleanup or signaling in concurrent tasks.

---

## Arrays in Swift

### 1. Core Characteristics
- Ordered, random-access, value-semantic collection.  
- Copy-on-write optimization.

### 2. Creation & Access
```swift
let odds = [1,3,5]
var empty: [String] = []
```

### 3. Modification
```swift
var students = ["Ben","Ivy"]
students.append("Max")
students.insert("Liam", at:1)
students.removeLast()
```

### 4. Functional Methods
- `map`, `filter`, `sort`, `sorted`.

**Best Practice**: Use built-in methods over manual index manipulation.

---

## Interoperability with C and Objective-C

### 1. Key Features
- Direct import of Objective-C frameworks and C headers.  
- Automatic bridging for types like `NSString`.  
- Memory management for Core Foundation.

### 2. Best Practices
- Prefer Swift’s native constructs.  
- Use bridging headers responsibly.  
- Carefully manage memory with C pointers.

---

## Migrating Objective-C to Swift

### 1. Strategy
- Migrate incrementally.  
- Replace `.m` and `.h` with one `.swift` file.

### 2. Compatibility
- Subclass `NSObject` if needed.  
- Use `@objc` for Objective-C visibility.

**Best Practice**: Use incremental migration, preserving existing hierarchies and adopting Swift features progressively.

---

## Swift Strings: Advanced Unicode and Character Handling

### 1. Core Characteristics
- Value type, copy-on-write, fully Unicode-compliant.  
- `Character` represents extended grapheme clusters.

### 2. Unicode Nuances
```swift
let cafe1 = "Cafe\u{301}"
let cafe2 = "Café"
cafe1 == cafe2 // true
```

### 3. String Views
- `unicodeScalars`, `utf16`, `utf8`.

**Best Practice**: Understand grapheme clusters, prefer high-level operations over raw indices.

---

## Double: Floating-Point Decimal Values

### 1. Definition
- 64-bit floating-point type conforming to IEEE 754.  
- Handles infinity, NaN, etc.

### 2. Key Operations
```swift
let sr = someDouble.squareRoot()
let r = someDouble.rounded()
```
- `isNaN`, `isInfinite`, `isFinite` checks.

---

## Double Advanced Initialization: Low-Level Bit Manipulation

```swift
let x = Double(sign: .plus, exponent: -2, significand: 1.5)
```
- For precise IEEE 754 representations.

---

## Double: Truncating Remainder Calculation

```swift
var value = 8.625
value.formTruncatingRemainder(dividingBy: 0.75) // in-place remainder
```
- Truncates quotient before remainder.

---

## CustomDebugStringConvertible

```swift
struct Point: CustomDebugStringConvertible {
    let x,y: Int
    var debugDescription: String { "(\(x), \(y))" }
}
```
- More detailed debugging output than `CustomStringConvertible`.

---

## Swift Collection Types Overview

- **Array**: Ordered.  
- **Dictionary**: Key-value.  
- **Set**: Unordered, unique elements.  
- **Range**: Half-open `..<` or closed `...`.  
- **Zipping**: Combine two sequences.

**Best Practice**: Pick the right collection for your needs, leveraging Swift’s iteration and transformation methods.

---

## Double Initialization: Sign and Magnitude Manipulation

```swift
let c = Double(signOf: a, magnitudeOf: b)
```
- Transfers sign from one value to another’s magnitude.

---

## Sets in Swift

### 1. Purpose
- Collection of unique `Hashable` elements.  
- Fast membership checks.

### 2. Methods
```swift
let common = set1.intersection(set2)
let union = set1.union(set2)
let diff = set1.symmetricDifference(set2)
```

**Best Practice**: Use sets for uniqueness and fast lookups, prefer set-algebra methods over manual iteration.

---

## Double Initialization from Strings

```swift
let val = Double("42.5") // 42.5
let invalid = Double("invalid") // nil
```
- Supports decimal, hexadecimal, special values (`inf`, `nan`).

---

## Safe Double Initialization: Prevent Precision Loss

```swift
let x = Double(exactly: someValue) // optional
```
- Returns nil if rounding is required.

---

## Double: In-Place Negation

```swift
var x = 21.5
x.negate() // x is now -21.5
```
- Equivalent to unary minus but mutates in-place.

---

## OptionSet: Bitwise Set Representation

```swift
struct ShippingOptions: OptionSet {
    let rawValue: Int
    static let nextDay = ShippingOptions(rawValue: 1 << 0)
    ...
}
```
- Type-safe, bitwise flags.

---

## Equatable and Hashable

### 1. Purpose
- **Equatable**: Defines `==` and `!=` for value comparison.  
- **Hashable**: Enables dictionary keys and set membership.

```swift
struct Position: Equatable, Hashable { 
    var x,y: Int
}
```
- Automatic conformance if all properties are Equatable/Hashable.

---

## Floating-Point Minimum/Maximum

```swift
Double.minimum(10.0, .nan) // returns 10.0
Double.minimumMagnitude(10.0, -25.0) // picks by absolute value
```
- Picks smaller or larger based on numeric or magnitude, ignoring NaN if possible.

---

## Input and Output in Swift

```swift
print("Hello", 42, separator: ", ", terminator: "\n")
if let userInput = readLine() { ... }
let args = CommandLine.arguments
```
- Console logging and user input.

---

## Type Casting and Existential Types

- `numericCast` for integer conversions.  
- `withoutActuallyEscaping` for closure casting.  
- `unsafeDowncast`, `unsafeBitCast` for advanced, potentially dangerous conversions.  
- `AnyObject`, `AnyClass` store class or meta-type references.

**Best Practice**: Prefer safe casts (`as?`, `as!`) or protocol-based designs; only use unsafe casts when necessary.

---

## Double Initialization from NSNumber

- `Double(truncating: NSNumber)`: Truncates to `Double`.  
- `Double(exactly: NSNumber)`: Fails on precision loss.

---

## Debugging and Assertions

- `assert`, `precondition`, `fatalError` for validating assumptions.  
- Use `debugPrint` and `dump` for detailed object output.

---

## Swift Macros

- **Source Location Macros**: `#file`, `#line`, etc.  
- **Diagnostic Macros**: `#warning`, `#error`.  
- External macros for advanced code generation.  

**Best Practice**: Use macros to reduce boilerplate and for compile-time safety checks.

---

## Equatable Protocol: Value Comparison

- Automatic if all stored properties conform to Equatable.  
- Manual `==` for complex classes or references.  
- Distinguish from `===` (identity check).

---

## Double Rounding and Arithmetic

- `rounded()`, `round()`, `formTruncatingRemainder()`, `addingProduct()`.  
- IEEE 754 compliance for `NaN`, infinities, and rounding.

---

## Swift Concurrency Highlights

- **Actors** for isolated mutable state.  
- **Tasks** for structured async operations.  
- **AsyncSequence** for streaming data.  
- **TaskCancellationHandler** for immediate cleanup.

**Best Practice**: Embrace `async/await`, task groups, and actors to avoid data races.

---

## Objective-C API Asynchronous Conversion

- Obj-C methods with completion handlers can auto-convert to `async` Swift methods.  
- Fewer explicit closures, better error handling with `throws`.

---

## Strings and Text

- **Unicode**-safe.  
- Multiple views (`.utf8`, `.utf16`, `.unicodeScalars`).  
- Powerful regex and pattern matching.  

**Best Practice**: Treat strings as collections of characters, mindful of grapheme clusters.

---

## Manual Memory Management in Swift

- Unsafe pointers: `UnsafePointer<T>`, `UnsafeMutablePointer<T>`.  
- Use `withUnsafePointer(to:)` for scoped pointer access.  
- **Best Practice**: Use sparingly; rely on Swift’s memory safety features first.

---

## Language Interoperability: C++ and Swift

- Swift can now call C++ APIs directly and vice versa.  
- Projects can contain shared framework targets bridging Swift and C++.  
- **Best Practice**: Keep cross-language boundaries clean, minimize complex type conversions.

---

## Cocoa Design Patterns in Swift

- **KVO** (Key-Value Observing) for property observation.  
- **Delegate** pattern for callbacks.  
- **Singleton** for shared resources.  
- Swift error handling integrates with Cocoa’s `NSError`.

---

## Enumerations for App State

```swift
enum AppState {
    case unregistered
    case loggedIn(User)
    case sessionExpired(User)
}
```
- Prevents invalid state combos, uses associated values for context.

---

## Summary of Best Practices

- **Use safe casting** (`as?`) over forced (`as!`).  
- **Use actors** or concurrency features to avoid data races.  
- **Adopt Swift** structures, generics, and protocols for robust designs.  
- **Leverage standard library** (collections, numeric types, concurrency) before building custom solutions.  
- **Embrace Swift’s advanced string handling**, respecting Unicode.  
- **Gradually migrate** Objective-C code to Swift, adopting modern Swift patterns.  
- **Minimize unsafe pointer** usage; rely on memory-safe abstractions.  
- **Organize code** with enumerations or option sets to prevent hidden state complexities.  
- **Design for accessibility**, concurrency correctness, and clarity.

---
