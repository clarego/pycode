export interface Task {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  usesTurtle?: boolean;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  color: string;
  tasks: Task[];
}

export const curriculum: Module[] = [
  {
    id: 'module-1',
    number: 1,
    title: 'Turtle Basics',
    description: 'Draw lines, shapes, change colours, use pen up/down and goto() to create turtle art.',
    difficulty: 'Beginner',
    estimatedTime: '30 min',
    color: 'emerald',
    tasks: [
      {
        id: 'm1-t1',
        title: 'Draw a Square',
        description: 'Use the turtle module to draw a square with side length 100. Move forward, turn right, and repeat 4 times.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(3)

# Draw a square
# Hint: forward(100) and right(90), repeated 4 times
`,
        expectedOutput: 'A square drawn on screen using turtle graphics.',
        hint: 'Use a sequence of t.forward(100) and t.right(90) four times in a row — or think about how you could use a for loop with range(4).',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm1-t2',
        title: 'Colourful Triangle',
        description: 'Draw a triangle and make each side a different colour. Use t.pencolor() to change the drawing colour.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(3)

colours = ["red", "blue", "green"]

# Draw a triangle with each side a different colour
# Use pencolor() before each side
`,
        expectedOutput: 'A triangle with red, blue, and green sides.',
        hint: 'Change t.pencolor("red") before drawing each side. The exterior angle of a triangle is 120 degrees.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm1-t3',
        title: 'Pen Up and Goto',
        description: 'Draw two separate squares in different positions on screen using penup(), goto(), and pendown().',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

# Draw a square at position (-150, 0)
t.penup()
t.goto(-150, 0)
t.pendown()

# Draw your first square here

# Now lift the pen, move to (50, 0), and draw a second square

`,
        expectedOutput: 'Two squares drawn at different positions on the canvas.',
        hint: 'After drawing the first square, use t.penup(), t.goto(50, 0), then t.pendown() before drawing the second square.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm1-t4',
        title: 'Fill a Shape',
        description: 'Draw a filled circle and a filled square using t.fillcolor(), t.begin_fill(), and t.end_fill().',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(3)

# Draw a filled yellow circle
t.fillcolor("yellow")
t.begin_fill()
t.circle(60)
t.end_fill()

# Move to a new position and draw a filled blue square

`,
        expectedOutput: 'A yellow filled circle and a blue filled square.',
        hint: 'Wrap any drawing code between t.begin_fill() and t.end_fill(). Make sure to set t.fillcolor() before calling begin_fill().',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm1-t5',
        title: 'Star Pattern',
        description: 'Draw a 5-pointed star using only forward() and right(). The exterior angle of a star is 144 degrees.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)
t.pencolor("gold")
t.pensize(2)

# Draw a 5-pointed star
# Each point: forward(150), right(144)
# Repeat 5 times
`,
        expectedOutput: 'A 5-pointed gold star drawn on screen.',
        hint: 'A star has 5 points. Each step is: forward(150), then right(144). Repeat exactly 5 times.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
    ],
  },
  {
    id: 'module-2',
    number: 2,
    title: 'Turtle with WHILE Loops',
    description: 'Use while loops to control repetition in turtle drawings — spirals, staircases, and growing patterns.',
    difficulty: 'Beginner',
    estimatedTime: '40 min',
    color: 'cyan',
    tasks: [
      {
        id: 'm2-t1',
        title: 'Square with a While Loop',
        description: 'Draw a square using a while loop. Count from 0 to 3, moving forward 100 and turning right 90 each time.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

counter = 0
while counter < 4:
    # Move forward and turn right
    # Then increment the counter
    pass
`,
        expectedOutput: 'A square drawn using a while loop.',
        hint: 'Inside the loop: t.forward(100), t.right(90), counter += 1. The loop runs while counter < 4.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm2-t2',
        title: 'Staircase Pattern',
        description: 'Draw a staircase where each step gets bigger. Use a while loop and increase the step size each iteration.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

step = 10
while step <= 100:
    t.forward(step)
    t.right(90)
    t.forward(step)
    t.left(90)
    step += 10  # Each step gets 10 units bigger
`,
        expectedOutput: 'A staircase pattern where each step increases in size.',
        hint: 'Each "step" goes forward then down. Increase the step size by 10 each time through the loop.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm2-t3',
        title: 'Shrinking Spiral',
        description: 'Draw a shrinking spiral: move forward by the counter value, turn right 91 degrees, and decrease the counter each time.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(0)
t.pencolor("teal")

counter = 100
while counter > 0:
    t.forward(counter)
    t.right(91)
    counter -= 2  # Shrink by 2 each time
`,
        expectedOutput: 'A shrinking inward spiral.',
        hint: 'Start with counter = 100. Each loop: forward(counter), right(91), then counter -= 2. The spiral shrinks to the centre.',
        difficulty: 'Intermediate',
        usesTurtle: true,
      },
      {
        id: 'm2-t4',
        title: 'Growing Star',
        description: 'Draw a growing star pattern: while counter < 360, move forward 200 and turn right 170 degrees.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(0)
t.pencolor("orange")

counter = 0
while counter < 360:
    t.forward(200)
    t.right(170)
    counter += 1
`,
        expectedOutput: 'A beautiful star pattern made from overlapping lines.',
        hint: 'The key is turning 170 degrees — not 360/5. This creates a different angle that produces a star burst pattern.',
        difficulty: 'Intermediate',
        usesTurtle: true,
      },
      {
        id: 'm2-t5',
        title: 'CHALLENGE: User-Defined Polygon',
        description: 'Ask the user to input a number of sides, then draw that polygon using a while loop. The exterior angle is 360 / number_of_sides.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

sides = int(input("How many sides? "))
angle = 360 / sides
length = 100

counter = 0
while counter < sides:
    # Move forward and turn by the exterior angle
    pass
`,
        expectedOutput: 'A regular polygon with however many sides the user requested.',
        hint: 'The exterior angle for any regular polygon is 360 / sides. Inside the loop: forward(length), right(angle), counter += 1.',
        difficulty: 'Intermediate',
        usesTurtle: true,
      },
    ],
  },
  {
    id: 'module-3',
    number: 3,
    title: 'Turtle with FOR Loops',
    description: 'Use for loops and range() to draw regular polygons, colour wheels, and even plot mathematical functions.',
    difficulty: 'Beginner',
    estimatedTime: '45 min',
    color: 'sky',
    tasks: [
      {
        id: 'm3-t1',
        title: 'Triangle with for loop',
        description: 'Draw an equilateral triangle using "for i in range(3)". Each side is 150 units, exterior angle is 120 degrees.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

for i in range(3):
    t.forward(150)
    t.right(120)
`,
        expectedOutput: 'A triangle drawn using a for loop.',
        hint: 'range(3) gives you 0, 1, 2 — three iterations. forward(150) then right(120) draws each side of an equilateral triangle.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm3-t2',
        title: 'Regular Polygon Generator',
        description: 'Ask for the number of sides (n) and draw that polygon. Use a for loop with the exterior angle formula: 360 / n.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

n = int(input("Enter number of sides: "))
angle = 360 / n

for i in range(n):
    t.forward(100)
    t.right(angle)
`,
        expectedOutput: 'A regular polygon with n sides.',
        hint: 'The exterior angle of any regular polygon is 360 / n. A hexagon has 6 sides and exterior angle 60°.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm3-t3',
        title: 'Bullseye',
        description: 'Draw a bullseye (concentric circles) using a for loop. Each circle should be bigger than the last.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(0)

colours = ["red", "white", "red", "white", "red"]

for i in range(5):
    t.fillcolor(colours[i])
    t.begin_fill()
    t.circle(20 + i * 20)
    t.end_fill()
    t.penup()
    t.goto(0, -(20 + i * 20))
    t.pendown()
`,
        expectedOutput: 'A bullseye with alternating red and white circles.',
        hint: 'Draw the circles from smallest to largest. Reposition the turtle to the bottom of each circle before drawing using goto(0, -radius).',
        difficulty: 'Intermediate',
        usesTurtle: true,
      },
      {
        id: 'm3-t4',
        title: 'Colour Wheel',
        description: 'Draw a colour wheel by using a for loop to draw lines at different angles, changing pencolor each time.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(0)

colours = ["red", "orange", "yellow", "green", "blue", "cyan", "magenta", "pink", "lime", "navy", "purple", "brown"]

for i in range(len(colours)):
    t.pencolor(colours[i])
    t.pensize(3)
    t.forward(150)
    t.backward(150)
    t.right(360 / len(colours))
`,
        expectedOutput: 'Lines radiating from the centre in different colours, forming a colour wheel.',
        hint: 'Each "spoke" goes forward 150, then back 150 to return to centre. Turn by 360 / number_of_colours to space them evenly.',
        difficulty: 'Beginner',
        usesTurtle: true,
      },
      {
        id: 'm3-t5',
        title: 'MATHS CHALLENGE: Plot y = x²',
        description: 'Plot the graph of y = x² using turtle. Loop x from -10 to 10, calculate y = x², then scale and plot each point.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(0)
t.penup()

scale = 5  # Multiply coordinates to make them fit the screen

for x in range(-10, 11):
    y = x ** 2
    t.goto(x * scale, -y * scale + 200)  # Flip y so it points up, shift up
    t.pendown()
    t.dot(5, "blue")

turtle.done()
`,
        expectedOutput: 'A parabola (U-shape) plotted on screen using turtle dots.',
        hint: 'Scale x and y so they fit nicely on screen. Negate y (use -y) so the parabola opens upward. Shift up by adding 200 to the y coordinate.',
        difficulty: 'Advanced',
        usesTurtle: true,
      },
    ],
  },
  {
    id: 'module-4',
    number: 4,
    title: 'Variables, Input & Output',
    description: 'Build text-based programs that ask users for input, perform calculations, and display results.',
    difficulty: 'Beginner',
    estimatedTime: '35 min',
    color: 'amber',
    tasks: [
      {
        id: 'm4-t1',
        title: 'Personalised Greeting',
        description: 'Ask the user for their name and age, then print a personalised greeting including both.',
        starterCode: `# Ask for name and age
name = input("What is your name? ")
age = input("How old are you? ")

# Print a personalised greeting
print(f"Hello, {name}!")
print(f"You are {age} years old.")
`,
        expectedOutput: 'Hello, [name]! You are [age] years old.',
        hint: 'Use input() to get both values. Use an f-string: f"Hello, {name}!" to include variables inside the string.',
        difficulty: 'Beginner',
      },
      {
        id: 'm4-t2',
        title: 'Four Operations Calculator',
        description: 'Ask for two numbers, then print their sum, difference, product, and quotient.',
        starterCode: `# Get two numbers from the user
a = float(input("Enter first number: "))
b = float(input("Enter second number: "))

# Calculate and print all four operations
print(f"Sum:        {a} + {b} = {a + b}")
print(f"Difference: {a} - {b} = {a - b}")
print(f"Product:    {a} x {b} = {a * b}")
# Add the quotient (be careful about dividing by zero!)
`,
        expectedOutput: 'Sum, difference, product, and quotient of the two numbers.',
        hint: 'Use float() to convert input to a decimal number. Division in Python uses /. Consider what happens if b = 0.',
        difficulty: 'Beginner',
      },
      {
        id: 'm4-t3',
        title: 'Rectangle Calculator',
        description: 'Ask for the length and width of a rectangle. Calculate and print the area (l × w) and perimeter (2 × (l + w)).',
        starterCode: `# Get rectangle dimensions
length = float(input("Enter length: "))
width = float(input("Enter width: "))

# Calculate area and perimeter
area = length * width
perimeter = 2 * (length + width)

print(f"Area:      {area}")
print(f"Perimeter: {perimeter}")
`,
        expectedOutput: 'Area and perimeter of the rectangle.',
        hint: 'Area = length × width. Perimeter = 2 × (length + width). Use float() so it handles decimal inputs.',
        difficulty: 'Beginner',
      },
      {
        id: 'm4-t4',
        title: 'Simple Interest Calculator',
        description: 'Calculate simple interest: I = PRT/100. Ask for principal (P), rate (R), and time (T) in years.',
        starterCode: `# Simple Interest: I = PRT / 100
principal = float(input("Enter principal amount (£): "))
rate = float(input("Enter interest rate (%): "))
time = float(input("Enter time in years: "))

interest = (principal * rate * time) / 100
total = principal + interest

print(f"Simple Interest: £{interest:.2f}")
print(f"Total Amount:    £{total:.2f}")
`,
        expectedOutput: 'The simple interest earned and the total amount.',
        hint: 'The formula is I = (P × R × T) / 100. Use :.2f in the f-string to round to 2 decimal places.',
        difficulty: 'Beginner',
      },
      {
        id: 'm4-t5',
        title: 'Temperature Converter',
        description: 'Ask for a temperature in Celsius and convert it to both Fahrenheit and Kelvin.',
        starterCode: `# Temperature Converter
celsius = float(input("Enter temperature in Celsius: "))

# Convert to Fahrenheit: F = (C × 9/5) + 32
fahrenheit = (celsius * 9 / 5) + 32

# Convert to Kelvin: K = C + 273.15
kelvin = celsius + 273.15

print(f"{celsius}°C = {fahrenheit:.1f}°F")
print(f"{celsius}°C = {kelvin:.2f}K")
`,
        expectedOutput: 'Temperature in Fahrenheit and Kelvin.',
        hint: 'Fahrenheit: multiply Celsius by 9/5 then add 32. Kelvin: simply add 273.15 to Celsius.',
        difficulty: 'Beginner',
      },
    ],
  },
  {
    id: 'module-5',
    number: 5,
    title: 'If / Elif / Else',
    description: 'Make decisions in your programs. Use conditions to branch between different outcomes.',
    difficulty: 'Beginner',
    estimatedTime: '45 min',
    color: 'orange',
    tasks: [
      {
        id: 'm5-t1',
        title: 'Positive, Negative, or Zero',
        description: 'Ask the user for a number. Print whether it is positive, negative, or zero using if/elif/else.',
        starterCode: `number = float(input("Enter a number: "))

if number > 0:
    print(f"{number} is positive")
elif number < 0:
    print(f"{number} is negative")
else:
    print("The number is zero")
`,
        expectedOutput: 'Positive, negative, or zero message.',
        hint: 'Use three branches: if number > 0, elif number < 0, else. The else handles exactly when number == 0.',
        difficulty: 'Beginner',
      },
      {
        id: 'm5-t2',
        title: 'Grade Calculator',
        description: 'Ask for a score (0–100). Use elif to print the grade: A (90+), B (80–89), C (70–79), D (60–69), F (below 60).',
        starterCode: `score = int(input("Enter your score (0-100): "))

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Score: {score} — Grade: {grade}")
`,
        expectedOutput: 'The grade corresponding to the score entered.',
        hint: 'Start from the highest grade (>= 90 for A). Python checks conditions in order, so >= 80 only runs if the first condition was false.',
        difficulty: 'Beginner',
      },
      {
        id: 'm5-t3',
        title: 'Leap Year Checker',
        description: 'A year is a leap year if divisible by 4, UNLESS it is divisible by 100, UNLESS it is divisible by 400.',
        starterCode: `year = int(input("Enter a year: "))

# Leap year rules:
# Divisible by 400 -> leap year
# Divisible by 100 -> NOT a leap year
# Divisible by 4   -> leap year
# Otherwise        -> NOT a leap year

if year % 400 == 0:
    print(f"{year} is a leap year")
elif year % 100 == 0:
    print(f"{year} is NOT a leap year")
elif year % 4 == 0:
    print(f"{year} is a leap year")
else:
    print(f"{year} is NOT a leap year")
`,
        expectedOutput: 'Whether the year is a leap year.',
        hint: 'Check in order: divisible by 400 first (always leap), then by 100 (not leap), then by 4 (leap). Use the modulo operator %.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm5-t4',
        title: 'Triangle Classifier',
        description: 'Ask for 3 side lengths. Check if it is a valid triangle, then classify it as equilateral, isosceles, or scalene.',
        starterCode: `a = float(input("Side a: "))
b = float(input("Side b: "))
c = float(input("Side c: "))

# Check if valid triangle (sum of any two sides > third side)
if a + b > c and a + c > b and b + c > a:
    if a == b == c:
        print("Equilateral triangle")
    elif a == b or b == c or a == c:
        print("Isosceles triangle")
    else:
        print("Scalene triangle")
else:
    print("Not a valid triangle")
`,
        expectedOutput: 'Triangle type or "not valid".',
        hint: 'A triangle is valid if the sum of any two sides is greater than the third. Then compare sides: equilateral (all equal), isosceles (two equal), scalene (all different).',
        difficulty: 'Intermediate',
      },
      {
        id: 'm5-t5',
        title: 'MATHS CHALLENGE: Quadratic Solver',
        description: 'Solve ax² + bx + c = 0. Calculate the discriminant (b² - 4ac) and use if/elif/else to find the number of roots.',
        starterCode: `import math

a = float(input("Enter a: "))
b = float(input("Enter b: "))
c = float(input("Enter c: "))

discriminant = b**2 - 4*a*c

if discriminant > 0:
    x1 = (-b + math.sqrt(discriminant)) / (2 * a)
    x2 = (-b - math.sqrt(discriminant)) / (2 * a)
    print(f"Two real roots: x = {x1:.4f} and x = {x2:.4f}")
elif discriminant == 0:
    x = -b / (2 * a)
    print(f"One real root: x = {x:.4f}")
else:
    print("No real roots (discriminant is negative)")
`,
        expectedOutput: 'The roots of the quadratic equation, or a message if no real roots exist.',
        hint: 'Discriminant = b² - 4ac. If > 0: two roots. If = 0: one root. If < 0: no real roots. Use math.sqrt() and the quadratic formula: x = (-b ± √discriminant) / (2a).',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    id: 'module-6',
    number: 6,
    title: 'For Loops with Maths & Lists',
    description: 'Use for loops with lists and mathematical logic to solve number problems.',
    difficulty: 'Intermediate',
    estimatedTime: '50 min',
    color: 'rose',
    tasks: [
      {
        id: 'm6-t1',
        title: 'Times Table Printer',
        description: 'Ask for a number and use a for loop to print its 1–12 times table.',
        starterCode: `n = int(input("Enter a number for its times table: "))

print(f"\\n--- {n} Times Table ---")
for i in range(1, 13):
    print(f"{n} x {i} = {n * i}")
`,
        expectedOutput: 'The full 1 to 12 times table for the entered number.',
        hint: 'Use range(1, 13) to go from 1 to 12 inclusive. Inside the loop: n * i gives you each result.',
        difficulty: 'Beginner',
      },
      {
        id: 'm6-t2',
        title: 'Sum of a List',
        description: 'Given a list of numbers, use a for loop to manually calculate the total. Then verify your answer using sum().',
        starterCode: `numbers = [12, 45, 7, 23, 89, 4, 56, 31]

total = 0
for num in numbers:
    total += num

print(f"Manual total: {total}")
print(f"Using sum():  {sum(numbers)}")
print(f"Match: {total == sum(numbers)}")
`,
        expectedOutput: 'The sum calculated manually and verified with sum().',
        hint: 'Start with total = 0. In the loop, add each number to total using total += num. Compare with sum(numbers) at the end.',
        difficulty: 'Beginner',
      },
      {
        id: 'm6-t3',
        title: 'Find the Maximum',
        description: 'Find the maximum value in a list WITHOUT using the built-in max() function. Use a for loop and a variable to track the largest seen.',
        starterCode: `numbers = [34, 12, 78, 5, 92, 41, 67, 23]

largest = numbers[0]  # Start by assuming the first number is largest

for num in numbers:
    if num > largest:
        largest = num

print(f"List:    {numbers}")
print(f"Maximum: {largest}")
print(f"Verify:  {max(numbers)}")
`,
        expectedOutput: 'The maximum value found manually and verified with max().',
        hint: 'Start with largest = numbers[0]. Loop through each num. If num > largest, update largest = num. At the end, largest holds the maximum.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm6-t4',
        title: 'FizzBuzz',
        description: 'Classic FizzBuzz: for numbers 1 to 100, print "Fizz" if divisible by 3, "Buzz" if by 5, "FizzBuzz" if both.',
        starterCode: `for i in range(1, 101):
    if i % 3 == 0 and i % 5 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`,
        expectedOutput: '1 to 100 with Fizz, Buzz, and FizzBuzz substitutions.',
        hint: 'Check FizzBuzz FIRST (divisible by both 3 and 5), then Fizz (only 3), then Buzz (only 5). Use the modulo operator %.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm6-t5',
        title: 'MATHS CHALLENGE: Prime Numbers to 100',
        description: 'Print all prime numbers between 1 and 100. Use a for loop with an inner loop to check if each number has any divisors.',
        starterCode: `print("Prime numbers from 1 to 100:")
primes = []

for n in range(2, 101):
    is_prime = True
    for divisor in range(2, n):
        if n % divisor == 0:
            is_prime = False
            break
    if is_prime:
        primes.append(n)

print(primes)
print(f"Total primes: {len(primes)}")
`,
        expectedOutput: 'All prime numbers from 1 to 100.',
        hint: 'For each number n, check if any number from 2 to n-1 divides it evenly. If none do, it is prime. The break statement exits the inner loop early when a divisor is found.',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    id: 'module-7',
    number: 7,
    title: 'Functions (def)',
    description: 'Write reusable blocks of code with def. Pass arguments, return values, and build a small function library.',
    difficulty: 'Intermediate',
    estimatedTime: '55 min',
    color: 'teal',
    tasks: [
      {
        id: 'm7-t1',
        title: 'Greeting Function',
        description: 'Write a function greet(name) that returns a personalised greeting string. Call it several times with different names.',
        starterCode: `def greet(name):
    return f"Hello, {name}! Welcome to Python."

# Test the function
print(greet("Alice"))
print(greet("Bob"))
print(greet("Year 10"))

# Now modify it to also accept an age parameter: greet(name, age)
`,
        expectedOutput: 'Greeting messages for each name.',
        hint: 'A function uses def keyword, takes parameters in brackets, and uses return to send a value back. Call it with greet("Alice") to use it.',
        difficulty: 'Beginner',
      },
      {
        id: 'm7-t2',
        title: 'Circle Area Function',
        description: 'Write a function area_circle(radius) that returns the area of a circle (π × r²). Test it on several radii.',
        starterCode: `import math

def area_circle(radius):
    return math.pi * radius ** 2

# Test with different radii
for r in [1, 5, 10, 7.5]:
    area = area_circle(r)
    print(f"Radius {r}: Area = {area:.2f}")
`,
        expectedOutput: 'Area of circles for each radius tested.',
        hint: 'Use math.pi for an accurate value of π. The formula is π × r². Python uses ** for powers, so r**2 means r squared.',
        difficulty: 'Beginner',
      },
      {
        id: 'm7-t3',
        title: 'Is Prime Function',
        description: 'Write a function is_prime(n) that returns True if n is prime, False otherwise. Test it on a range of numbers.',
        starterCode: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

# Test the function
for num in [1, 2, 3, 4, 17, 20, 97, 100]:
    print(f"{num}: {'Prime' if is_prime(num) else 'Not prime'}")
`,
        expectedOutput: 'Prime or not-prime verdict for each tested number.',
        hint: 'You only need to check divisors up to the square root of n (int(n**0.5) + 1). This is much faster than checking all numbers up to n.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm7-t4',
        title: 'Draw Polygon Function',
        description: 'Write a function draw_polygon(sides, length) using turtle that draws any regular polygon. Call it multiple times.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(5)

def draw_polygon(sides, length):
    angle = 360 / sides
    for i in range(sides):
        t.forward(length)
        t.right(angle)

# Draw several shapes
t.penup(); t.goto(-200, 0); t.pendown()
draw_polygon(3, 80)   # Triangle

t.penup(); t.goto(-50, 0); t.pendown()
draw_polygon(5, 70)   # Pentagon

t.penup(); t.goto(120, 0); t.pendown()
draw_polygon(8, 50)   # Octagon
`,
        expectedOutput: 'Multiple polygons drawn on screen using the reusable function.',
        hint: 'Define the function once with def draw_polygon(sides, length). Then call it multiple times with different arguments — that is the power of functions!',
        difficulty: 'Intermediate',
        usesTurtle: true,
      },
      {
        id: 'm7-t5',
        title: 'MATHS CHALLENGE: Linear Solver + Factorial',
        description: 'Write solve_linear(a, b) to solve ax + b = 0, and factorial(n) to calculate n! using a loop. Test both functions.',
        starterCode: `def solve_linear(a, b):
    # Solve: ax + b = 0  =>  x = -b / a
    if a == 0:
        return None  # No solution if a = 0
    return -b / a

def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# Test solve_linear
print("Linear equations:")
print(f"2x + 6 = 0  =>  x = {solve_linear(2, 6)}")
print(f"3x - 9 = 0  =>  x = {solve_linear(3, -9)}")
print(f"5x + 0 = 0  =>  x = {solve_linear(5, 0)}")

# Test factorial
print("\\nFactorials:")
for n in range(1, 8):
    print(f"{n}! = {factorial(n)}")
`,
        expectedOutput: 'Solutions to linear equations and factorial values.',
        hint: 'For solve_linear: rearrange ax + b = 0 to get x = -b/a. For factorial: start result = 1, then multiply by each number from 2 to n.',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    id: 'module-8',
    number: 8,
    title: 'While Loops for Problem Solving',
    description: 'Use while loops for input validation, games, running totals, and menus.',
    difficulty: 'Intermediate',
    estimatedTime: '50 min',
    color: 'violet',
    tasks: [
      {
        id: 'm8-t1',
        title: 'Password Checker',
        description: 'Keep asking the user for a password until they type the correct one. Count the number of attempts.',
        starterCode: `correct_password = "python123"
attempts = 0

while True:
    password = input("Enter password: ")
    attempts += 1

    if password == correct_password:
        print(f"Access granted! (took {attempts} attempt(s))")
        break
    else:
        print("Wrong password, try again.")
`,
        expectedOutput: 'Keeps asking until the correct password is entered, then shows attempt count.',
        hint: 'Use while True: to loop forever, then break out when the correct password is entered. A counter variable tracks attempts.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm8-t2',
        title: 'Number Guessing Game',
        description: 'The computer picks a random number 1–100. The player guesses, getting "too high" or "too low" hints until correct.',
        starterCode: `import random

secret = random.randint(1, 100)
guesses = 0

print("I'm thinking of a number between 1 and 100...")

while True:
    guess = int(input("Your guess: "))
    guesses += 1

    if guess < secret:
        print("Too low!")
    elif guess > secret:
        print("Too high!")
    else:
        print(f"Correct! The number was {secret}. You got it in {guesses} guesses!")
        break
`,
        expectedOutput: 'Interactive number guessing game with hints.',
        hint: 'Use random.randint(1, 100) to pick a secret number. Compare guess to secret with if/elif/else. Break when they match.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm8-t3',
        title: 'Running Total',
        description: 'Keep asking the user for numbers. Add each to a running total. Stop when they enter 0. Print total and count.',
        starterCode: `total = 0
count = 0

print("Enter numbers to add up. Type 0 to stop.")

while True:
    num = float(input("Enter a number (0 to stop): "))

    if num == 0:
        break

    total += num
    count += 1
    print(f"Running total: {total}")

print(f"\\nFinal total: {total}")
print(f"Numbers entered: {count}")
if count > 0:
    print(f"Average: {total / count:.2f}")
`,
        expectedOutput: 'Running total displayed after each entry, final total and count when done.',
        hint: 'Use while True and break when 0 is entered. Track total += num and count += 1 each loop.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm8-t4',
        title: 'Text Menu System',
        description: 'Build a text menu that loops until the user quits. Use if/elif to handle each menu option.',
        starterCode: `while True:
    print("\\n=== MENU ===")
    print("1. Say hello")
    print("2. Show the date")
    print("3. Calculate square")
    print("Q. Quit")

    choice = input("\\nEnter choice: ").strip().upper()

    if choice == "1":
        name = input("Your name: ")
        print(f"Hello, {name}!")
    elif choice == "2":
        from datetime import date
        print(f"Today is: {date.today()}")
    elif choice == "3":
        n = float(input("Enter a number: "))
        print(f"{n}² = {n**2}")
    elif choice == "Q":
        print("Goodbye!")
        break
    else:
        print("Invalid choice. Try again.")
`,
        expectedOutput: 'Interactive menu that responds to each option and loops until Q is pressed.',
        hint: 'Loop forever with while True. Read the choice, use if/elif to handle each option, and break when "Q" is entered. .upper() makes it case-insensitive.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm8-t5',
        title: 'MATHS CHALLENGE: GCD with Euclidean Algorithm',
        description: 'Use a while loop to find the Greatest Common Divisor (GCD) of two numbers using the Euclidean algorithm.',
        starterCode: `a = int(input("Enter first number: "))
b = int(input("Enter second number: "))

original_a, original_b = a, b

# Euclidean algorithm: while b != 0, set a, b = b, a % b
while b != 0:
    a, b = b, a % b

gcd = a
print(f"GCD({original_a}, {original_b}) = {gcd}")

# Verify
import math
print(f"Verify: math.gcd = {math.gcd(original_a, original_b)}")
`,
        expectedOutput: 'The GCD of the two entered numbers.',
        hint: 'The Euclidean algorithm: repeatedly replace (a, b) with (b, a mod b) until b = 0. At that point, a is the GCD. Python lets you swap with a, b = b, a % b in one line.',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    id: 'module-9',
    number: 9,
    title: 'Lists, Strings & Data Processing',
    description: 'Store and process collections of data. Work with strings, lists, and built-in functions.',
    difficulty: 'Intermediate',
    estimatedTime: '55 min',
    color: 'pink',
    tasks: [
      {
        id: 'm9-t1',
        title: 'Numbered Name List',
        description: 'Store 5 student names in a list. Print them numbered using a for loop with enumerate().',
        starterCode: `students = ["Alice", "Bob", "Charlie", "Diana", "Eve"]

print("Class List:")
for i, name in enumerate(students, 1):
    print(f"  {i}. {name}")

# Add your own name to the list using .append()
students.append("Your Name")
print(f"\\nTotal students: {len(students)}")
`,
        expectedOutput: 'Numbered list of student names.',
        hint: 'enumerate(students, 1) gives you pairs of (1, "Alice"), (2, "Bob"), etc. Unpack with for i, name in enumerate(...).',
        difficulty: 'Beginner',
      },
      {
        id: 'm9-t2',
        title: 'Statistics from User Input',
        description: 'Ask the user to enter 5 numbers into a list using a loop. Then calculate and print mean, min, and max.',
        starterCode: `numbers = []

print("Enter 5 numbers:")
for i in range(5):
    num = float(input(f"Number {i + 1}: "))
    numbers.append(num)

mean = sum(numbers) / len(numbers)
minimum = min(numbers)
maximum = max(numbers)

print(f"\\nYour numbers: {numbers}")
print(f"Mean:    {mean:.2f}")
print(f"Minimum: {minimum}")
print(f"Maximum: {maximum}")
`,
        expectedOutput: 'Mean, minimum, and maximum of the 5 entered numbers.',
        hint: 'Use .append() to add each number to the list. Calculate mean = sum(numbers) / len(numbers). Use built-in min() and max().',
        difficulty: 'Beginner',
      },
      {
        id: 'm9-t3',
        title: 'Word Counter',
        description: 'Ask for a sentence. Count the total words and how many start with a vowel. Use .split() and string methods.',
        starterCode: `sentence = input("Enter a sentence: ")
words = sentence.split()
total_words = len(words)

vowels = "aeiouAEIOU"
vowel_words = 0

for word in words:
    if word[0] in vowels:
        vowel_words += 1

print(f"\\nSentence: '{sentence}'")
print(f"Total words:       {total_words}")
print(f"Words starting with a vowel: {vowel_words}")
`,
        expectedOutput: 'Word count and vowel-starting word count.',
        hint: 'Use sentence.split() to get a list of words. Check word[0] (first character) to see if it is in the string "aeiouAEIOU".',
        difficulty: 'Intermediate',
      },
      {
        id: 'm9-t4',
        title: 'Password Strength Checker',
        description: 'Check a password for uppercase letters, digits, special characters, and length 8+. Rate it as Weak, OK, or Strong.',
        starterCode: `password = input("Enter a password to check: ")

has_upper = any(c.isupper() for c in password)
has_digit = any(c.isdigit() for c in password)
has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
long_enough = len(password) >= 8

score = sum([has_upper, has_digit, has_special, long_enough])

print(f"\\nPassword analysis:")
print(f"  Uppercase letter: {'Yes' if has_upper else 'No'}")
print(f"  Contains digit:   {'Yes' if has_digit else 'No'}")
print(f"  Special character:{'Yes' if has_special else 'No'}")
print(f"  8+ characters:    {'Yes' if long_enough else 'No'}")

if score <= 2:
    print("\\nStrength: WEAK")
elif score == 3:
    print("\\nStrength: OK")
else:
    print("\\nStrength: STRONG")
`,
        expectedOutput: 'Password analysis and strength rating.',
        hint: 'Use any() with a generator to check conditions across all characters. any(c.isupper() for c in password) returns True if any character is uppercase.',
        difficulty: 'Intermediate',
      },
      {
        id: 'm9-t5',
        title: 'MATHS CHALLENGE: Fibonacci List',
        description: 'Store the first 20 Fibonacci numbers in a list. Print them, then find which ones are even.',
        starterCode: `fib = [0, 1]

for i in range(18):  # 18 more to make 20 total
    fib.append(fib[-1] + fib[-2])

print("First 20 Fibonacci numbers:")
for i, n in enumerate(fib, 1):
    print(f"  F({i}) = {n}")

even_fibs = [n for n in fib if n % 2 == 0]
print(f"\\nEven Fibonacci numbers: {even_fibs}")
print(f"Count: {len(even_fibs)}")
`,
        expectedOutput: 'The first 20 Fibonacci numbers and those that are even.',
        hint: 'Start with fib = [0, 1]. Each new number is fib[-1] + fib[-2] (the last two). A list comprehension [n for n in fib if n % 2 == 0] filters the even ones.',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    id: 'module-10',
    number: 10,
    title: 'Capstone: Maths Solver + Turtle Art',
    description: 'Combine everything you have learned to build a maths problem solver and create advanced turtle artwork.',
    difficulty: 'Advanced',
    estimatedTime: '70 min',
    color: 'red',
    tasks: [
      {
        id: 'm10-t1',
        title: 'Fibonacci Spiral',
        description: 'Draw a Fibonacci spiral using turtle. Calculate each segment length from the Fibonacci sequence and draw quarter-circle arcs.',
        starterCode: `import turtle

t = turtle.Turtle()
t.speed(3)
t.pencolor("gold")
t.pensize(2)

fib = [1, 1]
for i in range(8):
    fib.append(fib[-1] + fib[-2])

for length in fib:
    t.circle(length * 5, 90)  # Quarter circle arc with radius = length * 5

turtle.done()
`,
        expectedOutput: 'A Fibonacci spiral drawn in gold.',
        hint: 'Use t.circle(radius, 90) to draw a quarter-circle arc. Each arc radius comes from the Fibonacci sequence multiplied by a scale factor.',
        difficulty: 'Advanced',
        usesTurtle: true,
      },
      {
        id: 'm10-t2',
        title: 'Linear Equation Parser',
        description: 'Ask the user for an equation in the form "ax + b = c" (e.g. "3x + 5 = 14"), parse it, and solve for x.',
        starterCode: `import re

equation = input("Enter equation (e.g. 3x + 5 = 14): ")

# Parse: ax + b = c
match = re.match(r'([+-]?\\d*)x\\s*([+-]\\s*\\d+)?\\s*=\\s*([+-]?\\d+)', equation.replace(' ', ''))

if match:
    a_str = match.group(1)
    b_str = match.group(2) or '0'
    c_str = match.group(3)

    a = int(a_str) if a_str not in ('', '+', '-') else (1 if a_str != '-' else -1)
    b = int(b_str.replace(' ', ''))
    c = int(c_str)

    # ax + b = c  =>  x = (c - b) / a
    x = (c - b) / a
    print(f"\\nSolving: {equation}")
    print(f"  a={a}, b={b}, c={c}")
    print(f"  x = ({c} - {b}) / {a} = {x}")
else:
    print("Could not parse equation. Try format: 3x + 5 = 14")
`,
        expectedOutput: 'The value of x that solves the entered equation.',
        hint: 'The formula for ax + b = c is x = (c - b) / a. You can use string methods or regex to extract a, b, c from the equation string.',
        difficulty: 'Advanced',
      },
      {
        id: 'm10-t3',
        title: 'Statistics Calculator',
        description: 'Ask for numbers separated by commas. Calculate and print mean, median, mode, and range.',
        starterCode: `data_input = input("Enter numbers separated by commas: ")
numbers = [float(x.strip()) for x in data_input.split(',')]
numbers.sort()

n = len(numbers)
mean = sum(numbers) / n

# Median
if n % 2 == 0:
    median = (numbers[n//2 - 1] + numbers[n//2]) / 2
else:
    median = numbers[n//2]

# Mode
from collections import Counter
counts = Counter(numbers)
max_count = max(counts.values())
mode = [k for k, v in counts.items() if v == max_count]

data_range = max(numbers) - min(numbers)

print(f"\\nData: {numbers}")
print(f"Mean:   {mean:.2f}")
print(f"Median: {median:.2f}")
print(f"Mode:   {mode} (appears {max_count} times)")
print(f"Range:  {data_range}")
`,
        expectedOutput: 'Mean, median, mode, and range of the entered dataset.',
        hint: 'Sort the list first for median. Median is middle value (odd count) or average of two middle values (even count). Use Counter from collections for mode.',
        difficulty: 'Advanced',
      },
      {
        id: 'm10-t4',
        title: 'Geometry Tool with Turtle',
        description: 'Ask for a shape (circle/rectangle/triangle) and measurements. Print area and perimeter, then draw it with turtle.',
        starterCode: `import turtle
import math

t = turtle.Turtle()
t.speed(5)

shape = input("Shape (circle/rectangle/triangle): ").lower()

if shape == "circle":
    r = float(input("Radius: "))
    area = math.pi * r**2
    perimeter = 2 * math.pi * r
    print(f"Area: {area:.2f}, Circumference: {perimeter:.2f}")
    t.circle(r * 2)

elif shape == "rectangle":
    w = float(input("Width: "))
    h = float(input("Height: "))
    area = w * h
    perimeter = 2 * (w + h)
    print(f"Area: {area:.2f}, Perimeter: {perimeter:.2f}")
    for _ in range(2):
        t.forward(w); t.right(90)
        t.forward(h); t.right(90)

elif shape == "triangle":
    s = float(input("Side length: "))
    area = (math.sqrt(3) / 4) * s**2
    perimeter = 3 * s
    print(f"Area: {area:.2f}, Perimeter: {perimeter:.2f}")
    for _ in range(3):
        t.forward(s); t.right(120)
`,
        expectedOutput: 'Area and perimeter printed, shape drawn on screen.',
        hint: 'Use if/elif to handle each shape. Circle area = πr², rectangle area = w×h, equilateral triangle area = (√3/4)×s². Then use turtle commands to draw each shape.',
        difficulty: 'Advanced',
        usesTurtle: true,
      },
      {
        id: 'm10-t5',
        title: 'FINAL CHALLENGE: Number Pattern Detector',
        description: 'Given a list of numbers, determine if the sequence is arithmetic (constant difference), geometric (constant ratio), or neither.',
        starterCode: `numbers_input = input("Enter a sequence (comma-separated): ")
seq = [float(x.strip()) for x in numbers_input.split(',')]

def is_arithmetic(seq):
    diff = seq[1] - seq[0]
    return all(seq[i+1] - seq[i] == diff for i in range(len(seq)-1)), diff

def is_geometric(seq):
    if 0 in seq:
        return False, None
    ratio = seq[1] / seq[0]
    return all(abs(seq[i+1] / seq[i] - ratio) < 1e-9 for i in range(len(seq)-1)), ratio

arith, diff = is_arithmetic(seq)
geom, ratio = is_geometric(seq)

print(f"\\nSequence: {seq}")
if arith:
    print(f"ARITHMETIC sequence — common difference: {diff}")
elif geom:
    print(f"GEOMETRIC sequence — common ratio: {ratio}")
else:
    print("NEITHER arithmetic nor geometric")
`,
        expectedOutput: 'The pattern type and common difference or ratio if applicable.',
        hint: 'For arithmetic: check if seq[i+1] - seq[i] is the same for all i. For geometric: check if seq[i+1] / seq[i] is the same for all i. Be careful with floating-point comparisons — use abs(a - b) < small_number.',
        difficulty: 'Advanced',
      },
    ],
  },
];
