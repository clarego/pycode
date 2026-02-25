export interface Template {
  name: string;
  files: Record<string, string>;
}

export const templates: Template[] = [
  {
    name: 'Hello World',
    files: {
      'main.py': `# Hello World - Your first Python program!
print("Hello, World!")
print("Welcome to Python 3!")

name = "Student"
print(f"Nice to meet you, {name}!")

for i in range(5):
    print(f"  Count: {i + 1}")

print("\\nHappy coding!")`,
    },
  },
  {
    name: 'Matplotlib Chart',
    files: {
      'main.py': `import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 200)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(2 * x) * 0.5

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y1, label='sin(x)', linewidth=2, color='#0ea5e9')
ax.plot(x, y2, label='cos(x)', linewidth=2, color='#f97316')
ax.plot(x, y3, label='0.5 sin(2x)', linewidth=2, color='#22c55e', linestyle='--')

ax.set_title('Trigonometric Functions', fontsize=16, fontweight='bold')
ax.set_xlabel('x (radians)')
ax.set_ylabel('y')
ax.legend(frameon=True, fancybox=True, shadow=True)
ax.grid(True, alpha=0.3)
ax.set_facecolor('#fafafa')
fig.tight_layout()

plt.show()
print("Chart rendered successfully!")`,
    },
  },
  {
    name: 'NumPy Array Demo',
    files: {
      'main.py': `import numpy as np

# Create arrays
a = np.array([1, 2, 3, 4, 5])
b = np.arange(0, 10, 2)
c = np.linspace(0, 1, 5)

print("Array a:", a)
print("Array b:", b)
print("Array c:", c)

# Array operations
print("\\n--- Array Operations ---")
print("a + 10:", a + 10)
print("a * 2:", a * 2)
print("a ** 2:", a ** 2)

# Matrix operations
print("\\n--- Matrix Operations ---")
matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])
print("Matrix:\\n", matrix)
print("Transpose:\\n", matrix.T)
print("Sum of all:", matrix.sum())
print("Mean of each row:", matrix.mean(axis=1))
print("Max of each column:", matrix.max(axis=0))

# Random numbers
print("\\n--- Random Numbers ---")
np.random.seed(42)
random_arr = np.random.randn(5)
print("Random normal:", np.round(random_arr, 3))
print("Mean:", round(random_arr.mean(), 3))
print("Std:", round(random_arr.std(), 3))`,
    },
  },
  {
    name: 'SciPy Stats Example',
    files: {
      'main.py': `import numpy as np
from scipy import stats

# Generate sample data
np.random.seed(42)
data = np.random.normal(loc=100, scale=15, size=200)

print("=== Descriptive Statistics ===")
print(f"Mean:     {np.mean(data):.2f}")
print(f"Median:   {np.median(data):.2f}")
print(f"Std Dev:  {np.std(data):.2f}")
print(f"Skewness: {stats.skew(data):.3f}")
print(f"Kurtosis: {stats.kurtosis(data):.3f}")

print("\\n=== Normality Test (Shapiro-Wilk) ===")
stat, p_value = stats.shapiro(data[:50])
print(f"Statistic: {stat:.4f}")
print(f"P-value:   {p_value:.4f}")
print(f"Normal:    {'Yes' if p_value > 0.05 else 'No'} (alpha=0.05)")

print("\\n=== T-Test (Two Samples) ===")
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(105, 15, 50)
t_stat, p_val = stats.ttest_ind(group_a, group_b)
print(f"Group A mean: {group_a.mean():.2f}")
print(f"Group B mean: {group_b.mean():.2f}")
print(f"T-statistic:  {t_stat:.3f}")
print(f"P-value:      {p_val:.4f}")

print("\\n=== Pearson Correlation ===")
x = np.random.normal(0, 1, 100)
y = 0.7 * x + np.random.normal(0, 0.5, 100)
r, p = stats.pearsonr(x, y)
print(f"Correlation: {r:.3f}")
print(f"P-value:     {p:.6f}")`,
    },
  },
  {
    name: 'Flask Web App',
    files: {
      'main.py': `from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html",
        title="My Flask App",
        message="Welcome to Flask!",
        features=[
            "Template rendering with Jinja2",
            "Route handling",
            "Static file support",
        ]
    )

if __name__ == "__main__":
    app.run(debug=True)
`,
      'templates/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="static/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>{{ title }}</h1>
            <p class="subtitle">{{ message }}</p>
        </header>
        <section class="features">
            <h2>Features</h2>
            <ul>
                {% for feature in features %}
                <li>{{ feature }}</li>
                {% endfor %}
            </ul>
        </section>
        <footer>
            <p>Built with Python Flask</p>
        </footer>
    </div>
</body>
</html>
`,
      'static/style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f4f8;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2d3748;
}

.container {
    background: white;
    padding: 2.5rem 3rem;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    max-width: 520px;
    width: 90%;
}

header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
}

h1 {
    color: #1a7f5a;
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
}

.subtitle {
    color: #718096;
    font-size: 1rem;
}

.features h2 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: #4a5568;
}

ul {
    list-style: none;
    padding: 0;
}

ul li {
    padding: 0.5rem 0;
    padding-left: 1.25rem;
    position: relative;
    border-bottom: 1px solid #edf2f7;
    font-size: 0.95rem;
}

ul li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1a7f5a;
}

ul li:last-child {
    border-bottom: none;
}

footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    color: #a0aec0;
    font-size: 0.8rem;
}
`,
    },
  },
  {
    name: 'Tkinter GUI Window',
    files: {
      'main.py': `# Note: Tkinter has limited browser support.
# This code is designed for desktop Python environments.
# In the browser, a simplified preview may be shown.

print("=" * 50)
print("  Tkinter GUI Demo")
print("=" * 50)
print()
print("Tkinter requires a desktop Python environment.")
print("This code would create a window with:")
print("  - A greeting label")
print("  - A text entry field")
print("  - A 'Greet' button")
print("  - A 'Quit' button")
print()
print("To run this locally, save the code and run:")
print("  python main.py")
print()
print("--- Simulated Output ---")
print("User types: 'Alice'")
print("Button clicked -> 'Hello, Alice!'")
print()

# Below is the full tkinter code for reference:
code = '''
import tkinter as tk

def greet():
    name = entry.get() or "World"
    label.config(text=f"Hello, {name}!")

root = tk.Tk()
root.title("Greeting App")
root.geometry("300x200")

tk.Label(root, text="Enter your name:", font=("Arial", 12)).pack(pady=10)

entry = tk.Entry(root, font=("Arial", 12))
entry.pack(pady=5)

tk.Button(root, text="Greet", command=greet,
          bg="#0ea5e9", fg="white", font=("Arial", 11)).pack(pady=10)

label = tk.Label(root, text="", font=("Arial", 14, "bold"))
label.pack(pady=10)

root.mainloop()
'''
print("Full tkinter source code:")
print(code)`,
    },
  },
  {
    name: 'Turtle Graphics',
    files: {
      'main.py': `"""
Turtle Animation — Cosmic Spiral Burst
Uses turtle graphics + time.sleep() for animated pacing effects.

Run with: python turtle_animation.py
"""

import turtle
import time
import math
import random

screen = turtle.Screen()
screen.title("Cosmic Spiral Burst")
screen.bgcolor("black")
screen.setup(width=800, height=800)
screen.tracer(0)

t = turtle.Turtle()
t.hideturtle()
t.speed(0)
t.pensize(2)

COLOURS = [
    "#FF4ECD", "#FF6B35", "#FFD700", "#00FF88",
    "#00CFFF", "#A66CFF", "#FF3366", "#7FFF00",
]

def draw_star(x, y, size, colour):
    t.penup()
    t.goto(x, y)
    t.pendown()
    t.color(colour)
    for _ in range(5):
        t.forward(size)
        t.right(144)

def burst(cx, cy, radius, colour, spokes=24):
    t.color(colour)
    for i in range(spokes):
        angle = (360 / spokes) * i
        rad   = math.radians(angle)
        x = cx + radius * math.cos(rad)
        y = cy + radius * math.sin(rad)
        t.penup();  t.goto(cx, cy)
        t.pendown(); t.goto(x, y)

def phase_spiral():
    t.penup(); t.goto(0, 0); t.setheading(0)
    for step in range(360):
        colour = COLOURS[step % len(COLOURS)]
        t.color(colour)
        t.pendown()
        t.forward(step * 0.55)
        t.right(59)
        if step % 30 == 0:
            screen.update()
            time.sleep(0.04)
    screen.update()
    time.sleep(0.6)

def phase_bursts():
    for r in range(20, 320, 40):
        colour = random.choice(COLOURS)
        burst(0, 0, r, colour)
        screen.update()
        time.sleep(0.12)
    time.sleep(0.5)

def phase_stars():
    for _ in range(40):
        x = random.randint(-350, 350)
        y = random.randint(-350, 350)
        size   = random.randint(8, 30)
        colour = random.choice(COLOURS)
        draw_star(x, y, size, colour)
        if _ % 5 == 0:
            screen.update()
            time.sleep(0.07)
    screen.update()
    time.sleep(0.6)

def phase_flower():
    t.penup(); t.goto(0, 0); t.setheading(0)
    for petal in range(36):
        colour = COLOURS[petal % len(COLOURS)]
        t.color(colour)
        t.pendown()
        t.circle(100, 60)
        t.right(120)
        t.circle(100, 60)
        t.right(180 - (360 / 36))
        if petal % 6 == 0:
            screen.update()
            time.sleep(0.08)
    screen.update()
    time.sleep(0.6)

def phase_text():
    writer = turtle.Turtle()
    writer.hideturtle()
    writer.penup()
    writer.color("white")
    for msg, col in [("3", "#FF4ECD"), ("2", "#FFD700"), ("1", "#00FF88"), ("Done!", "white")]:
        writer.clear()
        writer.color(col)
        writer.goto(0, -40)
        writer.write(msg, align="center", font=("Arial", 72, "bold"))
        screen.update()
        time.sleep(0.7)
    writer.clear()

print("Starting animation...")

phase_spiral()

t.clear()
phase_bursts()

phase_stars()

t.clear()
phase_flower()

phase_text()

screen.update()
print("Animation complete! Click the window to exit.")
screen.exitonclick()`,
    },
  },
  {
    name: 'Pygame Player Movement',
    files: {
      'main.py': `import pygame
import sys

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((800, 600))
player = pygame.Rect(375, 275, 50, 50)
clock = pygame.time.Clock()

# Game Loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: running = False

    # Input handling
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]: player.x -= 5
    if keys[pygame.K_RIGHT]: player.x += 5
    if keys[pygame.K_UP]: player.y -= 5
    if keys[pygame.K_DOWN]: player.y += 5

    # Drawing
    screen.fill((255, 255, 255))
    pygame.draw.rect(screen, (0, 0, 255), player)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
    },
  },
  {
    name: '2D Table to JSON File',
    files: {
      'main.py': `import json

# Simple 2D table as a list of lists
table = [
    ["Name", "Age", "Subject"],
    ["Alice", 25, "Math"],
    ["Bob", 30, "Science"],
    ["Charlie", 28, "English"]
]

# Write to JSON file
with open('table.json', 'w') as f:
    json.dump(table, f, indent=2)

print("JSON file created successfully!")`,
    },
  },
  {
    name: 'Student Database - Basic CRUD',
    files: {
      'main.py': `# CREATE a 2D array with user input - no correction
students = [["Name", "Age", "Grade"]]  # Start with headers

# Get number of students
num_students = int(input("How many students? "))

# Get data for each student
for i in range(num_students):
    print("\\nStudent " + str(i+1) + ":")
    name = input("Name: ")
    age = int(input("Age: "))
    grade = int(input("Grade: "))
    students.append([name, age, grade])

# READ - Print the entire array
print("\\nStudent List")
for row in students:
    print(row)

# EDIT - Add one more student
print("\\nAdd Another Student")
name = input("Name: ")
age = int(input("Age: "))
grade = int(input("Grade: "))
students.append([name, age, grade])

# EDIT - Modify a student's grade
print("\\nUpdate a Grade")
student_num = int(input("Which student number? "))
new_grade = int(input("New grade: "))
students[student_num][2] = new_grade

# EDIT - Delete a student
print("\\nDelete a Student")
student_num = int(input("Which student number to delete? "))
del students[student_num]

# Print final array
print("\\nFinal Student List")
for row in students:
    print(row)`,
    },
  },
  {
    name: 'Student Database - With Validation',
    files: {
      'main.py': `# CREATE a 2D array with user input and error detection
students = [["Name", "Age", "Grade"]]  # Start with headers

# Get number of students
num_students = input("How many students? ")
while not num_students.isdigit():
    print("Error! Please enter a number.")
    num_students = input("How many students? ")
num_students = int(num_students)

# Get data for each student
for i in range(num_students):
    print("\\nStudent " + str(i+1) + ":")
    name = input("Name: ")

    age = input("Age: ")
    while not age.isdigit():
        print("Error! Please enter a number.")
        age = input("Age: ")
    age = int(age)

    grade = input("Grade: ")
    while not grade.isdigit():
        print("Error! Please enter a number.")
        grade = input("Grade: ")
    grade = int(grade)

    students.append([name, age, grade])

# Print the array
print("\\n--- Student List ---")
for row in students:
    print(row)`,
    },
  },
  {
    name: 'Student Database - Search & Sort',
    files: {
      'main.py': `# CREATE a 2D array with user input
students = [["Name", "Age", "Grade"]]  # Start with headers

# Get number of students
num_students = input("How many students? ")
while not num_students.isdigit():
    print("Error! Please enter a number.")
    num_students = input("How many students? ")
num_students = int(num_students)

# Get data for each student
for i in range(num_students):
    print("\\nStudent " + str(i+1) + ":")
    name = input("Name: ")

    age = input("Age: ")
    while not age.isdigit():
        print("Error! Please enter a number.")
        age = input("Age: ")
    age = int(age)

    grade = input("Grade: ")
    while not grade.isdigit():
        print("Error! Please enter a number.")
        grade = input("Grade: ")
    grade = int(grade)

    students.append([name, age, grade])

# Print the array
print("\\n--- Student List ---")
for row in students:
    print(row)

# LINEAR SEARCH - Find a student by name
print("\\n--- Search for a Student ---")
search_name = input("Enter name to search: ")
found = False

for i in range(1, len(students)):  # Skip header row
    if students[i][0] == search_name:
        print("Found: " + str(students[i]))
        found = True
        break

if not found:
    print("Student not found.")

# SORT - Sort students by grade (highest to lowest)
print("\\n--- Sort by Grade ---")

# Bubble sort (simple sorting method)
for i in range(1, len(students) - 1):
    for j in range(1, len(students) - i):
        if students[j][2] < students[j + 1][2]:  # Compare grades
            # Swap rows
            temp = students[j]
            students[j] = students[j + 1]
            students[j + 1] = temp

print("\\nSorted list (highest grade first):")
for row in students:
    print(row)`,
    },
  },
  {
    name: 'Student Database - CSV Export',
    files: {
      'main.py': `import csv

# CREATE a 2D array with user input
students = [["Name", "Age", "Grade"]]  # Start with headers

# Get number of students
num_students = input("How many students? ")
while not num_students.isdigit():
    print("Error! Please enter a number.")
    num_students = input("How many students? ")
num_students = int(num_students)

# Get data for each student
for i in range(num_students):
    print("\\nStudent " + str(i+1) + ":")
    name = input("Name: ")

    age = input("Age: ")
    while not age.isdigit():
        print("Error! Please enter a number.")
        age = input("Age: ")
    age = int(age)

    grade = input("Grade: ")
    while not grade.isdigit():
        print("Error! Please enter a number.")
        grade = input("Grade: ")
    grade = int(grade)

    students.append([name, age, grade])

# Print the array
print("\\n--- Student List ---")
for row in students:
    print(row)

# WRITE TO CSV FILE
print("\\n--- Saving to CSV ---")
with open('students.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(students)
print("Data saved to students.csv")

# READ FROM CSV FILE
print("\\n--- Reading from CSV ---")
with open('students.csv', 'r') as file:
    reader = csv.reader(file)
    loaded_data = []
    for row in reader:
        loaded_data.append(row)

print("Data loaded from students.csv:")
for row in loaded_data:
    print(row)`,
    },
  },
  {
    name: 'Tkinter Student Manager',
    files: {
      'main.py': `import tkinter as tk
from tkinter import messagebox
import csv

# Initialize data
students = [["Name", "Age", "Grade"]]

# CREATE - Add student
def add_student():
    name = entry_name.get()
    age = entry_age.get()
    grade = entry_grade.get()

    # Error check
    if not age.isdigit() or not grade.isdigit():
        messagebox.showerror("Error", "Age and Grade must be numbers!")
        return

    students.append([name, int(age), int(grade)])
    update_display()
    clear_entries()
    messagebox.showinfo("Success", "Student added!")

# READ - Display all students
def update_display():
    text_display.delete(1.0, tk.END)
    for row in students:
        text_display.insert(tk.END, str(row) + "\\n")

# EDIT - Delete student
def delete_student():
    row_num = entry_row.get()

    if not row_num.isdigit():
        messagebox.showerror("Error", "Row number must be a number!")
        return

    row_num = int(row_num)
    if row_num < 1 or row_num >= len(students):
        messagebox.showerror("Error", "Invalid row number!")
        return

    del students[row_num]
    update_display()
    messagebox.showinfo("Success", "Student deleted!")

# SEARCH - Linear search by name
def search_student():
    search_name = entry_search.get()
    found = False

    for i in range(1, len(students)):
        if students[i][0] == search_name:
            messagebox.showinfo("Found", str(students[i]))
            found = True
            break

    if not found:
        messagebox.showinfo("Not Found", "Student not found!")

# SORT - Sort by grade
def sort_students():
    for i in range(1, len(students) - 1):
        for j in range(1, len(students) - i):
            if students[j][2] < students[j + 1][2]:
                temp = students[j]
                students[j] = students[j + 1]
                students[j + 1] = temp

    update_display()
    messagebox.showinfo("Success", "Sorted by grade!")

# WRITE to CSV
def save_to_csv():
    with open('students.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(students)
    messagebox.showinfo("Success", "Saved to students.csv!")

# READ from CSV
def load_from_csv():
    global students
    try:
        with open('students.csv', 'r') as file:
            reader = csv.reader(file)
            students = []
            for row in reader:
                students.append(row)
        update_display()
        messagebox.showinfo("Success", "Loaded from students.csv!")
    except:
        messagebox.showerror("Error", "File not found!")

# Clear input fields
def clear_entries():
    entry_name.delete(0, tk.END)
    entry_age.delete(0, tk.END)
    entry_grade.delete(0, tk.END)

# Create main window
window = tk.Tk()
window.title("Student Manager")
window.geometry("600x650")
window.configure(bg="#f0f0f0")

# Main container with padding
main_frame = tk.Frame(window, bg="#f0f0f0")
main_frame.pack(expand=True, fill="both", padx=40, pady=20)

# Add Student Section
tk.Label(main_frame, text="Add Student", font=("Arial", 14, "bold"), bg="#f0f0f0").pack(pady=10)

tk.Label(main_frame, text="Name:", bg="#f0f0f0").pack()
entry_name = tk.Entry(main_frame, width=40)
entry_name.pack(pady=5)

tk.Label(main_frame, text="Age:", bg="#f0f0f0").pack()
entry_age = tk.Entry(main_frame, width=40)
entry_age.pack(pady=5)

tk.Label(main_frame, text="Grade:", bg="#f0f0f0").pack()
entry_grade = tk.Entry(main_frame, width=40)
entry_grade.pack(pady=5)

tk.Button(main_frame, text="Add Student", command=add_student, bg="#2ecc71", fg="white", width=20).pack(pady=10)

# Display Section
tk.Label(main_frame, text="Student List", font=("Arial", 14, "bold"), bg="#f0f0f0").pack(pady=10)
text_display = tk.Text(main_frame, height=10, width=60)
text_display.pack(pady=5)
update_display()

# Search Section
tk.Label(main_frame, text="Search by Name:", bg="#f0f0f0").pack(pady=(10, 0))
entry_search = tk.Entry(main_frame, width=40)
entry_search.pack(pady=5)
tk.Button(main_frame, text="Search", command=search_student, bg="#3498db", fg="white", width=20).pack(pady=5)

# Delete Section
tk.Label(main_frame, text="Delete Row Number:", bg="#f0f0f0").pack(pady=(10, 0))
entry_row = tk.Entry(main_frame, width=40)
entry_row.pack(pady=5)
tk.Button(main_frame, text="Delete", command=delete_student, bg="#e74c3c", fg="white", width=20).pack(pady=5)

# Action Buttons
button_frame = tk.Frame(main_frame, bg="#f0f0f0")
button_frame.pack(pady=15)

tk.Button(button_frame, text="Sort by Grade", command=sort_students, width=15).grid(row=0, column=0, padx=5)
tk.Button(button_frame, text="Save to CSV", command=save_to_csv, width=15).grid(row=0, column=1, padx=5)
tk.Button(button_frame, text="Load from CSV", command=load_from_csv, width=15).grid(row=0, column=2, padx=5)

# Run the application
window.mainloop()`,
    },
  },
  {
    name: 'Tkinter Score Manager (1D Array)',
    files: {
      'main.py': `import tkinter as tk
from tkinter import messagebox
import csv

# Initialize data - simple list
scores = []

# CREATE - Add score
def add_score():
    score = entry_score.get()

    # Error check
    if not score.isdigit():
        messagebox.showerror("Error", "Score must be a number!")
        return

    scores.append(int(score))
    update_display()
    entry_score.delete(0, tk.END)
    messagebox.showinfo("Success", "Score added!")

# READ - Display all scores
def update_display():
    text_display.delete(1.0, tk.END)
    for i in range(len(scores)):
        text_display.insert(tk.END, "Index " + str(i) + ": " + str(scores[i]) + "\\n")

# EDIT - Delete score
def delete_score():
    index = entry_index.get()

    if not index.isdigit():
        messagebox.showerror("Error", "Index must be a number!")
        return

    index = int(index)
    if index < 0 or index >= len(scores):
        messagebox.showerror("Error", "Invalid index!")
        return

    del scores[index]
    update_display()
    messagebox.showinfo("Success", "Score deleted!")

# EDIT - Modify score
def modify_score():
    index = entry_modify_index.get()
    new_score = entry_new_score.get()

    if not index.isdigit() or not new_score.isdigit():
        messagebox.showerror("Error", "Index and score must be numbers!")
        return

    index = int(index)
    if index < 0 or index >= len(scores):
        messagebox.showerror("Error", "Invalid index!")
        return

    scores[index] = int(new_score)
    update_display()
    messagebox.showinfo("Success", "Score modified!")

# SEARCH - Linear search for a score
def search_score():
    search_value = entry_search.get()

    if not search_value.isdigit():
        messagebox.showerror("Error", "Score must be a number!")
        return

    search_value = int(search_value)
    found = False

    for i in range(len(scores)):
        if scores[i] == search_value:
            messagebox.showinfo("Found", "Score " + str(search_value) + " found at index " + str(i))
            found = True
            break

    if not found:
        messagebox.showinfo("Not Found", "Score not found!")

# SORT - Sort scores (highest to lowest)
def sort_scores():
    for i in range(len(scores) - 1):
        for j in range(len(scores) - i - 1):
            if scores[j] < scores[j + 1]:
                temp = scores[j]
                scores[j] = scores[j + 1]
                scores[j + 1] = temp

    update_display()
    messagebox.showinfo("Success", "Sorted (highest to lowest)!")

# WRITE to CSV
def save_to_csv():
    with open('scores.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        for score in scores:
            writer.writerow([score])
    messagebox.showinfo("Success", "Saved to scores.csv!")

# READ from CSV
def load_from_csv():
    global scores
    try:
        with open('scores.csv', 'r') as file:
            reader = csv.reader(file)
            scores = []
            for row in reader:
                scores.append(int(row[0]))
        update_display()
        messagebox.showinfo("Success", "Loaded from scores.csv!")
    except:
        messagebox.showerror("Error", "File not found!")

# Create main window
window = tk.Tk()
window.title("Score Manager")
window.geometry("550x700")
window.configure(bg="#f0f0f0")

# Main container with padding
main_frame = tk.Frame(window, bg="#f0f0f0")
main_frame.pack(expand=True, fill="both", padx=40, pady=20)

# Add Score Section
tk.Label(main_frame, text="Add Score", font=("Arial", 14, "bold"), bg="#f0f0f0").pack(pady=10)
tk.Label(main_frame, text="Score:", bg="#f0f0f0").pack()
entry_score = tk.Entry(main_frame, width=40)
entry_score.pack(pady=5)
tk.Button(main_frame, text="Add Score", command=add_score, bg="#2ecc71", fg="white", width=20).pack(pady=10)

# Display Section
tk.Label(main_frame, text="Score List", font=("Arial", 14, "bold"), bg="#f0f0f0").pack(pady=10)
text_display = tk.Text(main_frame, height=8, width=50)
text_display.pack(pady=5)

# Search Section
tk.Label(main_frame, text="Search for Score:", bg="#f0f0f0").pack(pady=(10, 0))
entry_search = tk.Entry(main_frame, width=40)
entry_search.pack(pady=5)
tk.Button(main_frame, text="Search", command=search_score, bg="#3498db", fg="white", width=20).pack(pady=5)

# Modify Section
tk.Label(main_frame, text="Modify Score", font=("Arial", 12, "bold"), bg="#f0f0f0").pack(pady=10)
tk.Label(main_frame, text="Index:", bg="#f0f0f0").pack()
entry_modify_index = tk.Entry(main_frame, width=40)
entry_modify_index.pack(pady=5)
tk.Label(main_frame, text="New Score:", bg="#f0f0f0").pack()
entry_new_score = tk.Entry(main_frame, width=40)
entry_new_score.pack(pady=5)
tk.Button(main_frame, text="Modify", command=modify_score, bg="#f39c12", fg="white", width=20).pack(pady=10)

# Delete Section
tk.Label(main_frame, text="Delete Index:", bg="#f0f0f0").pack(pady=(10, 0))
entry_index = tk.Entry(main_frame, width=40)
entry_index.pack(pady=5)
tk.Button(main_frame, text="Delete", command=delete_score, bg="#e74c3c", fg="white", width=20).pack(pady=5)

# Action Buttons
button_frame = tk.Frame(main_frame, bg="#f0f0f0")
button_frame.pack(pady=15)

tk.Button(button_frame, text="Sort Scores", command=sort_scores, width=15).grid(row=0, column=0, padx=5)
tk.Button(button_frame, text="Save to CSV", command=save_to_csv, width=15).grid(row=0, column=1, padx=5)
tk.Button(button_frame, text="Load from CSV", command=load_from_csv, width=15).grid(row=0, column=2, padx=5)

# Run the application
window.mainloop()`,
    },
  },
];
