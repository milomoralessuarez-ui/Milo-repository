/* Algebra 2 — StudyQuest subject file, generated from standard high school curriculum content.
   Every question was written, then fact-checked item by item by a separate reviewer.
   Checked by: node tools/verify-study.mjs */
(window.STUDY_SUBJECTS = window.STUDY_SUBJECTS || []).push({
 "id": "alg2",
 "name": "Algebra 2",
 "emoji": "➗",
 "color": "#a78bfa",
 "blurb": "Functions and transformations, systems and matrices, quadratics and complex numbers, polynomials, radicals, exponentials and logarithms, rational functions, sequences, probability and trigonometry.",
 "sets": [
  {
   "id": "alg2-u1",
   "unit": 1,
   "title": "Functions and Transformations",
   "summary": "Learn to describe a function's domain and range in interval notation, recognize the parent functions, and predict how shifts, reflections, and stretches change their graphs and equations. You'll also work with piecewise and absolute value functions, classify functions as even or odd, combine functions through composition, and find inverse functions, using the horizontal line test to tell when an inverse is itself a function.",
   "topics": [
    "Domain and Range",
    "Parent Functions",
    "Transformations",
    "Piecewise and Absolute Value Functions",
    "Even and Odd Functions",
    "Composition of Functions",
    "Inverse Functions"
   ],
   "terms": [
    {
     "term": "Domain",
     "definition": "The set of all possible input (x) values for which a function is defined",
     "topic": "Domain and Range"
    },
    {
     "term": "Range",
     "definition": "The set of all possible output (y) values that a function can produce",
     "topic": "Domain and Range"
    },
    {
     "term": "Interval notation",
     "definition": "A way of writing a set of numbers using parentheses and brackets, such as (2, 5]",
     "topic": "Domain and Range"
    },
    {
     "term": "Function",
     "definition": "A relation in which every input value corresponds to exactly one output value",
     "topic": "Parent Functions"
    },
    {
     "term": "Parent function",
     "definition": "The simplest, most basic graph in a family of related graphs, from which others are built by transforming it",
     "topic": "Parent Functions"
    },
    {
     "term": "Linear parent function",
     "definition": "f(x) = x, a straight line through the origin with slope 1",
     "topic": "Parent Functions"
    },
    {
     "term": "Quadratic parent function",
     "definition": "f(x) = x², a parabola with its lowest point at the origin",
     "topic": "Parent Functions"
    },
    {
     "term": "Cubic parent function",
     "definition": "f(x) = x³, an S-shaped curve that passes through the origin",
     "topic": "Parent Functions"
    },
    {
     "term": "Square root parent function",
     "definition": "f(x) = √x, defined only for x ≥ 0",
     "topic": "Parent Functions"
    },
    {
     "term": "Absolute value parent function",
     "definition": "f(x) = |x|, a V-shaped graph with its corner at the origin",
     "topic": "Piecewise and Absolute Value Functions"
    },
    {
     "term": "Vertical shift",
     "definition": "A transformation that moves a graph up or down, written as f(x) + k",
     "topic": "Transformations"
    },
    {
     "term": "Horizontal shift",
     "definition": "A transformation that moves a graph left or right, written as f(x − h)",
     "topic": "Transformations"
    },
    {
     "term": "Reflection",
     "definition": "A transformation that flips a graph over an axis, produced by a negative sign in front of the function or inside it",
     "topic": "Transformations"
    },
    {
     "term": "Vertical stretch or compression",
     "definition": "y = a·f(x); |a| > 1 makes the graph taller, 0 < |a| < 1 makes it flatter",
     "topic": "Transformations"
    },
    {
     "term": "Horizontal stretch or compression",
     "definition": "y = f(bx); |b| > 1 squeezes the graph toward the y-axis, 0 < |b| < 1 widens it",
     "topic": "Transformations"
    },
    {
     "term": "Vertex form",
     "definition": "y = a(x − h)² + k, an equation that directly displays the shifts, reflection, and stretch applied to a parabola",
     "topic": "Transformations"
    },
    {
     "term": "Piecewise function",
     "definition": "A function defined by different equations over different intervals of its domain",
     "topic": "Piecewise and Absolute Value Functions"
    },
    {
     "term": "Vertex (of a graph)",
     "definition": "The turning point of a parabola or the corner point of an absolute value graph",
     "topic": "Piecewise and Absolute Value Functions"
    },
    {
     "term": "Even function",
     "definition": "A function for which f(−x) = f(x) for every x in the domain; its graph is symmetric about the y-axis",
     "topic": "Even and Odd Functions"
    },
    {
     "term": "Odd function",
     "definition": "A function for which f(−x) = −f(x) for every x in the domain; its graph has 180° rotational symmetry about the origin",
     "topic": "Even and Odd Functions"
    },
    {
     "term": "Composition of functions",
     "definition": "Combining two functions so the output of one becomes the input of the other",
     "topic": "Composition of Functions"
    },
    {
     "term": "(f∘g)(x)",
     "definition": "Notation meaning f(g(x)): evaluate the inner function first, then substitute its result into the outer function",
     "topic": "Composition of Functions"
    },
    {
     "term": "Inverse function",
     "definition": "A function that reverses another function's input-output pairs, written f⁻¹(x)",
     "topic": "Inverse Functions"
    },
    {
     "term": "Horizontal line test",
     "definition": "If no horizontal line crosses a function's graph more than once, its inverse is also a function",
     "topic": "Inverse Functions"
    },
    {
     "term": "One-to-one function",
     "definition": "A function in which every output value corresponds to exactly one input value",
     "topic": "Inverse Functions"
    }
   ],
   "questions": [
    {
     "id": "alg2-u1-q1",
     "type": "mc",
     "prompt": "What is the domain of f(x) = √(x − 3), written in interval notation?",
     "options": [
      "[3, ∞)",
      "(3, ∞)",
      "(−∞, 3]",
      "(−∞, ∞)"
     ],
     "answer": "[3, ∞)",
     "explanation": "The expression under a square root must be ≥ 0, so x − 3 ≥ 0, which gives x ≥ 3, or [3, ∞).",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q2",
     "type": "mc",
     "prompt": "What is the domain of f(x) = 1/(x − 4), written in interval notation?",
     "options": [
      "(−∞, 4) ∪ (4, ∞)",
      "[4, ∞)",
      "(−∞, 4]",
      "(−∞, ∞)"
     ],
     "answer": "(−∞, 4) ∪ (4, ∞)",
     "explanation": "A fraction is undefined when its denominator is 0, so x − 4 ≠ 0, meaning x ≠ 4; every other real number is allowed.",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q3",
     "type": "mc",
     "prompt": "What is the range of f(x) = x², written in interval notation?",
     "options": [
      "[0, ∞)",
      "(−∞, 0]",
      "(−∞, ∞)",
      "(0, ∞)"
     ],
     "answer": "[0, ∞)",
     "explanation": "Squaring any real number produces a value that is 0 or positive, and every non‑negative value is reachable, so the range is [0, ∞).",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q4",
     "type": "mc",
     "prompt": "What is the range of f(x) = |x − 2| + 3, written in interval notation?",
     "options": [
      "[3, ∞)",
      "(−∞, 3]",
      "[0, ∞)",
      "(3, ∞)"
     ],
     "answer": "[3, ∞)",
     "explanation": "|x − 2| has a minimum value of 0 (at x = 2), so the smallest output of f is 0 + 3 = 3; the graph rises without bound from there, giving [3, ∞).",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q5",
     "type": "mc",
     "prompt": "Which parent function has domain [0, ∞) and range [0, ∞)?",
     "options": [
      "f(x) = √x",
      "f(x) = |x|",
      "f(x) = x²",
      "f(x) = x³"
     ],
     "answer": "f(x) = √x",
     "explanation": "The square root function is only defined for x ≥ 0, and its outputs are also always ≥ 0, matching both restrictions; the other functions all accept every real input.",
     "topic": "Parent Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q6",
     "type": "mc",
     "prompt": "The graph of y = (x + 3)² − 4 is the parent function y = x² transformed how?",
     "options": [
      "shifted left 3 and down 4",
      "shifted right 3 and down 4",
      "shifted left 3 and up 4",
      "shifted right 3 and up 4"
     ],
     "answer": "shifted left 3 and down 4",
     "explanation": "Writing (x + 3) as (x − (−3)) shows h = −3, a shift left 3 units, and the −4 outside shifts the graph down 4 units.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q7",
     "type": "mc",
     "prompt": "Which equation shows the parent function y = x² shifted right 2 units and up 5 units?",
     "options": [
      "y = (x − 2)² + 5",
      "y = (x + 2)² + 5",
      "y = (x − 2)² − 5",
      "y = (x + 5)² + 2"
     ],
     "answer": "y = (x − 2)² + 5",
     "explanation": "A shift right 2 replaces x with (x − 2), and a shift up 5 adds 5 outside the squared term, giving y = (x − 2)² + 5.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q8",
     "type": "mc",
     "prompt": "Which equation represents y = |x| after a vertical stretch by a factor of 3 and a reflection over the x-axis?",
     "options": [
      "y = −3|x|",
      "y = 3|x|",
      "y = −|x|/3",
      "y = |−3x|"
     ],
     "answer": "y = −3|x|",
     "explanation": "A vertical stretch by 3 multiplies the output by 3, giving 3|x|, and a reflection over the x-axis negates the output, giving −3|x|.",
     "topic": "Transformations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q9",
     "type": "mc",
     "prompt": "Compared to y = f(x), the graph of y = f(2x) is a...",
     "options": [
      "horizontal compression by a factor of 1/2",
      "horizontal stretch by a factor of 2",
      "vertical stretch by a factor of 2",
      "vertical compression by a factor of 1/2"
     ],
     "answer": "horizontal compression by a factor of 1/2",
     "explanation": "Multiplying x by 2 inside the function makes inputs reach the same output twice as fast, squeezing the graph horizontally toward the y-axis by a factor of 1/2.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q10",
     "type": "mc",
     "prompt": "Given f(x) = x⁴ − 3x² + 1, which classification is correct?",
     "options": [
      "Even function",
      "Odd function",
      "Neither even nor odd",
      "Both even and odd"
     ],
     "answer": "Even function",
     "explanation": "f(−x) = (−x)⁴ − 3(−x)² + 1 = x⁴ − 3x² + 1, which equals f(x) for every x, so f is even.",
     "topic": "Even and Odd Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q11",
     "type": "mc",
     "prompt": "Which of the following functions is odd?",
     "options": [
      "x³ − x",
      "x² − 1",
      "x³ + 1",
      "|x|"
     ],
     "answer": "x³ − x",
     "explanation": "For f(x) = x³ − x, f(−x) = −x³ + x = −(x³ − x) = −f(x) for every x, which is the definition of an odd function; the other three fail this test.",
     "topic": "Even and Odd Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q12",
     "type": "mc",
     "prompt": "Let f(x) = x² + 1 and g(x) = x − 2. Which expression equals (f∘g)(x)?",
     "options": [
      "x² − 4x + 5",
      "x² + 4x + 5",
      "x² − 4x + 4",
      "x² − 4x + 3"
     ],
     "answer": "x² − 4x + 5",
     "explanation": "(f∘g)(x) = f(g(x)) = (x − 2)² + 1 = x² − 4x + 4 + 1 = x² − 4x + 5.",
     "topic": "Composition of Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q13",
     "type": "mc",
     "prompt": "Let f(x) = x² + 1 and g(x) = x − 2. Which expression equals (g∘f)(x)?",
     "options": [
      "x² − 1",
      "x² + 1",
      "x² − 3",
      "(x − 2)² + 1"
     ],
     "answer": "x² − 1",
     "explanation": "(g∘f)(x) = g(f(x)) = (x² + 1) − 2 = x² − 1.",
     "topic": "Composition of Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q14",
     "type": "mc",
     "prompt": "What is the inverse of f(x) = 3x − 6?",
     "options": [
      "f⁻¹(x) = (x + 6)/3",
      "f⁻¹(x) = (x − 6)/3",
      "f⁻¹(x) = 3x + 6",
      "f⁻¹(x) = x/3 + 6"
     ],
     "answer": "f⁻¹(x) = (x + 6)/3",
     "explanation": "Set y = 3x − 6, swap x and y to get x = 3y − 6, then solve: x + 6 = 3y, so y = (x + 6)/3.",
     "topic": "Inverse Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q15",
     "type": "mc",
     "prompt": "Which function passes the horizontal line test?",
     "options": [
      "f(x) = x³",
      "f(x) = x²",
      "f(x) = |x|",
      "f(x) = x⁴"
     ],
     "answer": "f(x) = x³",
     "explanation": "f(x) = x³ is always increasing, so each horizontal line crosses it only once. The others fail: for example, y = 4 crosses x² at x = ±2, |x| at x = ±4, and x⁴ at x = ±√2.",
     "topic": "Inverse Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q16",
     "type": "mc",
     "prompt": "A phone plan costs a flat $20 for up to 500 texts, then $0.05 per text for every text beyond 500. What type of function models this plan?",
     "options": [
      "Piecewise function",
      "Absolute value function",
      "Quadratic function",
      "Square root function"
     ],
     "answer": "Piecewise function",
     "explanation": "The rule changes with the number of texts: C = 20 for 0 ≤ t ≤ 500 and C = 20 + 0.05(t − 500) for t > 500. A function with a different rule on each interval is a piecewise function.",
     "topic": "Piecewise and Absolute Value Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q17",
     "type": "mc",
     "prompt": "What is the vertex of y = −2|x + 1| − 3?",
     "options": [
      "(−1, −3)",
      "(1, −3)",
      "(−1, 3)",
      "(1, 3)"
     ],
     "answer": "(−1, −3)",
     "explanation": "Writing x + 1 as x − (−1) shows h = −1, and k = −3, so in vertex form y = a|x − h| + k the vertex is (−1, −3).",
     "topic": "Piecewise and Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q18",
     "type": "mc",
     "prompt": "Which equation reflects the graph of y = √x over the x-axis?",
     "options": [
      "y = −√x",
      "y = √(−x)",
      "y = √x − 1",
      "y = −√(−x)"
     ],
     "answer": "y = −√x",
     "explanation": "Reflecting over the x-axis negates the output of the function, changing y = √x into y = −√x; reflecting over the y-axis instead would give y = √(−x).",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q19",
     "type": "tf",
     "prompt": "The domain of every polynomial function is all real numbers.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Polynomials involve only addition, subtraction, and multiplication of terms, with no denominators or radicals, so any real number can be substituted in.",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q20",
     "type": "tf",
     "prompt": "The graph of f(x) = |x| is symmetric about the origin.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "f(x) = |x| is symmetric about the y-axis, not the origin, because f(−x) = |−x| = |x| = f(x), which is the definition of an even function.",
     "topic": "Even and Odd Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q21",
     "type": "tf",
     "prompt": "Every function that passes the vertical line test also passes the horizontal line test.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "f(x) = x² passes the vertical line test since it is a function, but it fails the horizontal line test because the line y = 4 crosses the graph twice, at x = 2 and x = −2.",
     "topic": "Inverse Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u1-q22",
     "type": "tf",
     "prompt": "The horizontal line test determines whether a function has an inverse that is also a function.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "If every horizontal line intersects the graph at most once, the function is one-to-one, so swapping inputs and outputs produces a valid inverse function.",
     "topic": "Inverse Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q23",
     "type": "tf",
     "prompt": "The graph of y = f(x − 5) shifts the graph of y = f(x) left 5 units.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Subtracting inside the function argument shifts the graph right, not left; y = f(x − 5) shifts y = f(x) right 5 units.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q24",
     "type": "tf",
     "prompt": "(f∘g)(x) means you evaluate f first, then substitute the result into g.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Composition (f∘g)(x) means f(g(x)): you evaluate the inner function g first, then substitute that result into f.",
     "topic": "Composition of Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q25",
     "type": "tf",
     "prompt": "A piecewise function can use different equations on different intervals of its domain.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "That is the defining feature of a piecewise function: each piece of the domain is assigned its own rule.",
     "topic": "Piecewise and Absolute Value Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q26",
     "type": "tf",
     "prompt": "If f(−x) = −f(x) for every x in the domain, the function is odd.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This equation is the algebraic definition of an odd function, and its graph has 180° rotational symmetry about the origin.",
     "topic": "Even and Odd Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q27",
     "type": "written",
     "prompt": "For f(x) = 5/(x + 7), what single x-value must be excluded from the domain?",
     "answer": "-7",
     "accept": [
      "−7",
      "x=-7",
      "x = -7",
      "x=−7",
      "x = −7"
     ],
     "explanation": "The denominator cannot be 0: x + 7 = 0 gives x = −7. Check: −7 + 7 = 0, so f(−7) would divide by zero and x = −7 is excluded.",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q28",
     "type": "written",
     "prompt": "The parabola y = (x − 3)² + 5 is the graph of y = x² translated to have its vertex at what ordered pair?",
     "answer": "(3, 5)",
     "accept": [
      "(3,5)",
      "3,5",
      "3, 5"
     ],
     "explanation": "In vertex form y = (x − h)² + k, h = 3 and k = 5, so the vertex moves to (3, 5).",
     "topic": "Transformations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q29",
     "type": "written",
     "prompt": "Let f(x) = x + 2 and g(x) = 3x. Find (f∘g)(2).",
     "answer": "8",
     "accept": [],
     "explanation": "First evaluate g(2) = 3(2) = 6, then substitute into f: f(6) = 6 + 2 = 8. Checking again, 3×2=6 and 6+2=8, confirmed.",
     "topic": "Composition of Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q30",
     "type": "written",
     "prompt": "If f(x) = 2x + 6, find f⁻¹(4).",
     "answer": "-1",
     "accept": [
      "−1",
      "x=-1",
      "x = -1",
      "x=−1",
      "x = −1"
     ],
     "explanation": "f⁻¹(4) is the x-value with f(x) = 4: 2x + 6 = 4, so 2x = −2 and x = −1. Check: 2(−1) + 6 = 4.",
     "topic": "Inverse Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q31",
     "type": "written",
     "prompt": "Evaluate the piecewise function f(x) = { x² if x < 0 ; 2x + 1 if x ≥ 0 } at x = −3.",
     "answer": "9",
     "accept": [],
     "explanation": "Since −3 < 0, use the first rule: f(−3) = (−3)² = 9.",
     "topic": "Piecewise and Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q32",
     "type": "written",
     "prompt": "Solve |x − 2| = 5 and give the positive solution.",
     "answer": "7",
     "accept": [
      "x=7",
      "x = 7"
     ],
     "explanation": "|x − 2| = 5 means x − 2 = 5 or x − 2 = −5, giving x = 7 or x = −3; the positive solution is 7. Checking: |7 − 2| = |5| = 5, confirmed.",
     "topic": "Piecewise and Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u1-q33",
     "type": "written",
     "prompt": "The graph of y = x² is shifted 4 units right and 2 units down. What is the vertex of the new graph, as an ordered pair?",
     "answer": "(4, -2)",
     "accept": [
      "(4,-2)",
      "4,-2",
      "4, -2",
      "(4,−2)",
      "(4, −2)",
      "4,−2",
      "4, −2"
     ],
     "explanation": "The parent vertex (0, 0) moves 4 right to x = 4 and 2 down to y = −2, so the new vertex is (4, −2); the equation is y = (x − 4)² − 2.",
     "topic": "Transformations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u1-q34",
     "type": "written",
     "prompt": "Let f(x) = x² and g(x) = x − 1. Find (g∘f)(4).",
     "answer": "15",
     "accept": [],
     "explanation": "First evaluate f(4) = 4² = 16, then substitute into g: g(16) = 16 − 1 = 15. Checking again, 4²=16 and 16−1=15, confirmed.",
     "topic": "Composition of Functions",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg2-u2",
   "unit": 2,
   "title": "Linear Systems and Matrices",
   "summary": "Solve systems of equations in two and three variables using elimination and substitution, and use systems of inequalities to find a feasible region and optimize an objective function with linear programming. Learn matrix vocabulary, how to add, subtract and multiply matrices, and how to compute the determinant of a 2×2 matrix.",
   "topics": [
    "Systems in Three Variables",
    "Elimination and Substitution",
    "Systems of Inequalities and Linear Programming",
    "Matrix Vocabulary",
    "Matrix Operations",
    "Determinants"
   ],
   "terms": [
    {
     "term": "System of equations",
     "definition": "A group of equations considered together that share the same variables and are solved at the same time.",
     "topic": "Systems in Three Variables"
    },
    {
     "term": "Solution of a system (three variables)",
     "definition": "An ordered triple (x, y, z) that makes every equation in the system true.",
     "topic": "Systems in Three Variables"
    },
    {
     "term": "Consistent system",
     "definition": "A system of equations that has at least one solution.",
     "topic": "Systems in Three Variables"
    },
    {
     "term": "Inconsistent system",
     "definition": "A system of equations that has no solution.",
     "topic": "Systems in Three Variables"
    },
    {
     "term": "Elimination method",
     "definition": "Adding or subtracting equations, after scaling, so that one variable cancels out and the system simplifies.",
     "topic": "Elimination and Substitution"
    },
    {
     "term": "Substitution method",
     "definition": "Solving one equation for a variable, then replacing that variable in the other equations with the result.",
     "topic": "Elimination and Substitution"
    },
    {
     "term": "Infinitely many solutions",
     "definition": "The result when equations describe the same relationship, so every point that satisfies one satisfies all.",
     "topic": "Elimination and Substitution"
    },
    {
     "term": "System of inequalities",
     "definition": "Two or more inequalities graphed together, sharing a common solution region.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Feasible region",
     "definition": "The overlapping area that satisfies every constraint in a linear programming problem.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Vertex (of feasible region)",
     "definition": "A corner point where two boundary lines of the feasible region intersect.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Objective function",
     "definition": "The linear expression, such as P = 3x + 5y, being maximized or minimized in a linear programming problem.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Constraint",
     "definition": "An inequality that limits the possible values of the variables in a linear programming problem.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Linear programming",
     "definition": "A method for finding the optimal value of an objective function subject to a set of limits.",
     "topic": "Systems of Inequalities and Linear Programming"
    },
    {
     "term": "Matrix",
     "definition": "A rectangular array of numbers arranged in rows and columns.",
     "topic": "Matrix Vocabulary"
    },
    {
     "term": "Dimensions of a matrix",
     "definition": "The size of an array, written as its number of rows times its number of columns.",
     "topic": "Matrix Vocabulary"
    },
    {
     "term": "Entry (element)",
     "definition": "A single number located inside an array, identified by its row and column position.",
     "topic": "Matrix Vocabulary"
    },
    {
     "term": "Square matrix",
     "definition": "An array that has the same number of rows as columns.",
     "topic": "Matrix Vocabulary"
    },
    {
     "term": "Matrix addition",
     "definition": "Combining two same-sized arrays by adding their corresponding entries.",
     "topic": "Matrix Operations"
    },
    {
     "term": "Matrix subtraction",
     "definition": "Combining two same-sized arrays by subtracting their corresponding entries.",
     "topic": "Matrix Operations"
    },
    {
     "term": "Scalar multiplication",
     "definition": "Multiplying every entry of an array by the same single real number.",
     "topic": "Matrix Operations"
    },
    {
     "term": "Matrix multiplication",
     "definition": "Combining rows of one array with columns of another by summing products of matching entries.",
     "topic": "Matrix Operations"
    },
    {
     "term": "Matrix multiplication compatibility rule",
     "definition": "Two arrays can only be multiplied when the columns of the first equal the rows of the second.",
     "topic": "Matrix Operations"
    },
    {
     "term": "Determinant",
     "definition": "A single number calculated from a square array that reveals key properties, such as invertibility.",
     "topic": "Determinants"
    },
    {
     "term": "Determinant of a 2×2 matrix",
     "definition": "For [[a, b], [c, d]], the value ad − bc.",
     "topic": "Determinants"
    }
   ],
   "questions": [
    {
     "id": "alg2-u2-q1",
     "type": "mc",
     "prompt": "What is the solution to a system of equations in three variables (x, y, and z) called?",
     "options": [
      "An ordered triple (x, y, z)",
      "An ordered pair (x, y)",
      "A single number",
      "A ratio of two numbers"
     ],
     "answer": "An ordered triple (x, y, z)",
     "explanation": "A system with three variables needs one value for each variable, so its solution is written as an ordered triple (x, y, z).",
     "topic": "Systems in Three Variables",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q2",
     "type": "tf",
     "prompt": "A system of three equations in three variables always has exactly one solution.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Like two-variable systems, a three-variable system can have no solution, exactly one solution, or infinitely many solutions.",
     "topic": "Systems in Three Variables",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q3",
     "type": "written",
     "prompt": "Solve the system: x + y + z = 6, 2x − y + z = 3, x + 2y − z = 2. What is the value of x?",
     "answer": "1",
     "accept": [
      "x=1",
      "x = 1"
     ],
     "explanation": "Adding equation 1 and 3 eliminates z: 2x + 3y = 8. Adding equation 2 and 3 eliminates z again: 3x + y = 5, so y = 5 − 3x. Substituting gives 2x + 3(5 − 3x) = 8 → −7x = −7 → x = 1.",
     "topic": "Systems in Three Variables",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q4",
     "type": "written",
     "prompt": "Using the same system, x + y + z = 6, 2x − y + z = 3, x + 2y − z = 2, what is the value of z?",
     "answer": "3",
     "accept": [
      "z=3",
      "z = 3"
     ],
     "explanation": "From x = 1 and 3x + y = 5, y = 5 − 3(1) = 2. Substituting x = 1, y = 2 into x + y + z = 6 gives z = 6 − 1 − 2 = 3.",
     "topic": "Systems in Three Variables",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q5",
     "type": "mc",
     "prompt": "A system of equations in three variables has no combination of values that satisfies all three equations at once. This system is best described as:",
     "options": [
      "Inconsistent",
      "Consistent",
      "Dependent",
      "Homogeneous"
     ],
     "answer": "Inconsistent",
     "explanation": "A system with no solution is called inconsistent, while a consistent system has at least one solution.",
     "topic": "Systems in Three Variables",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q6",
     "type": "mc",
     "prompt": "Which method solves a system by isolating one variable in one equation and replacing it into the other equations?",
     "options": [
      "Substitution",
      "Elimination",
      "Graphing",
      "Matrix inversion"
     ],
     "answer": "Substitution",
     "explanation": "Substitution solves for one variable in terms of the others and plugs that expression into the remaining equations.",
     "topic": "Elimination and Substitution",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q7",
     "type": "mc",
     "prompt": "Solve by elimination: 3x + 2y = 16 and x − 2y = 0. What is x?",
     "options": [
      "4",
      "2",
      "8",
      "−4"
     ],
     "answer": "4",
     "explanation": "Adding the two equations cancels y: (3x + 2y) + (x − 2y) = 16 + 0 → 4x = 16 → x = 4. Checking: 3(4) + 2(2) = 12 + 4 = 16.",
     "topic": "Elimination and Substitution",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q8",
     "type": "tf",
     "prompt": "In the elimination method, you can multiply an entire equation by a nonzero constant without changing its solution set.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Multiplying both sides of an equation by the same nonzero number keeps the equation equivalent, which is why elimination scales equations before adding or subtracting.",
     "topic": "Elimination and Substitution",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q9",
     "type": "written",
     "prompt": "Solve by substitution: y = 2x + 1 and 3x + y = 11. What is x?",
     "answer": "2",
     "accept": [
      "x=2",
      "x = 2"
     ],
     "explanation": "Substituting y = 2x + 1 into 3x + y = 11 gives 3x + 2x + 1 = 11 → 5x = 10 → x = 2. Checking: y = 2(2)+1 = 5, and 3(2)+5 = 11.",
     "topic": "Elimination and Substitution",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q10",
     "type": "mc",
     "prompt": "A system of two linear equations has infinitely many solutions. What must be true about the two equations?",
     "options": [
      "They represent the same line",
      "They have different slopes",
      "They are perpendicular lines",
      "They have no common solution"
     ],
     "answer": "They represent the same line",
     "explanation": "Infinitely many solutions occur when both equations describe the exact same line, so every point on it satisfies both equations.",
     "topic": "Elimination and Substitution",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q11",
     "type": "mc",
     "prompt": "In linear programming, the region that satisfies every constraint at once is called the:",
     "options": [
      "Feasible region",
      "Objective region",
      "Domain set",
      "Vertex set"
     ],
     "answer": "Feasible region",
     "explanation": "The feasible region is the overlap of all constraint inequalities, containing every point that satisfies all the constraints.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q12",
     "type": "mc",
     "prompt": "When the feasible region of a linear programming problem is bounded, the maximum or minimum value of the objective function always occurs at:",
     "options": [
      "A vertex of the feasible region",
      "The center of the feasible region",
      "Any point on a boundary line",
      "The origin"
     ],
     "answer": "A vertex of the feasible region",
     "explanation": "Because the objective function is linear, its maximum and minimum on a bounded feasible region are always reached at a corner point (vertex). If the objective function happens to be parallel to an edge, every point on that edge ties for the optimum, but the edge's endpoint vertices share that value. So checking the vertices is always enough.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q13",
     "type": "written",
     "prompt": "A feasible region has vertices (0,0), (0,4), (3,4), and (5,0). Find the maximum value of the objective function P = 3x + 5y.",
     "answer": "29",
     "accept": [
      "P=29",
      "P = 29"
     ],
     "explanation": "Evaluate P at each vertex: (0,0)→0, (0,4)→3(0)+5(4)=20, (3,4)→3(3)+5(4)=9+20=29, (5,0)→3(5)+5(0)=15. The largest value is 29.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q14",
     "type": "mc",
     "prompt": "A feasible region has vertices (0, 0), (0, 4), (3, 4) and (5, 0). At which vertex does P = 3x + 5y reach its maximum?",
     "answer": "(3, 4)",
     "accept": [],
     "explanation": "Test every vertex: P = 0 at (0, 0), 20 at (0, 4), 29 at (3, 4) and 15 at (5, 0), so the maximum, 29, is at (3, 4).",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "medium",
     "options": [
      "(3, 4)",
      "(0, 4)",
      "(5, 0)",
      "(0, 0)"
     ]
    },
    {
     "id": "alg2-u2-q15",
     "type": "tf",
     "prompt": "A constraint in a linear programming problem is an inequality that limits the possible values of the variables.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Constraints are the inequalities (like resource or time limits) that define the boundaries of the feasible region.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q16",
     "type": "mc",
     "prompt": "A farmer plants x acres of corn and y acres of wheat under the constraints x ≥ 0, y ≥ 0, x + y ≤ 100, and 2x + y ≤ 150. Which point lies in the feasible region?",
     "options": [
      "(40, 40)",
      "(60, 50)",
      "(0, 160)",
      "(80, 30)"
     ],
     "answer": "(40, 40)",
     "explanation": "Check (40,40): 40+40=80≤100 and 2(40)+40=120≤150, so it works. (60,50) gives 110>100; (0,160) gives 160>100; (80,30) gives 110>100 — all fail the first constraint.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q17",
     "type": "tf",
     "prompt": "Increasing the number of constraints in a linear programming problem can only enlarge the feasible region.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Each added constraint can only shrink the feasible region or leave it unchanged, since every point must now satisfy one more inequality.",
     "topic": "Systems of Inequalities and Linear Programming",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q18",
     "type": "mc",
     "prompt": "A matrix with 3 rows and 4 columns has dimensions written as:",
     "options": [
      "3 × 4",
      "4 × 3",
      "12 × 1",
      "3 + 4"
     ],
     "answer": "3 × 4",
     "explanation": "Matrix dimensions are always written as rows × columns, so 3 rows and 4 columns gives 3 × 4.",
     "topic": "Matrix Vocabulary",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q19",
     "type": "written",
     "prompt": "What is the entry in row 2, column 3 of the matrix [[1, 2, 3], [4, 5, 6]]?",
     "answer": "6",
     "accept": [],
     "explanation": "Row 2 is [4, 5, 6], and its third entry (column 3) is 6.",
     "topic": "Matrix Vocabulary",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q20",
     "type": "mc",
     "prompt": "A matrix that has the same number of rows as columns is called a:",
     "options": [
      "Square matrix",
      "Rectangular matrix",
      "Identity matrix",
      "Zero matrix"
     ],
     "answer": "Square matrix",
     "explanation": "A square matrix has equal numbers of rows and columns, such as a 2×2 or 3×3 matrix.",
     "topic": "Matrix Vocabulary",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q21",
     "type": "tf",
     "prompt": "The dimensions of a matrix are always written as columns × rows.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Matrix dimensions are written as rows × columns, not columns × rows.",
     "topic": "Matrix Vocabulary",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q22",
     "type": "mc",
     "prompt": "In matrix vocabulary, a single number located inside a matrix is called a(n):",
     "options": [
      "Entry",
      "Dimension",
      "Determinant",
      "Scalar"
     ],
     "answer": "Entry",
     "explanation": "Each individual number inside a matrix, identified by its row and column, is called an entry (or element).",
     "topic": "Matrix Vocabulary",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q23",
     "type": "mc",
     "prompt": "What is [[1, 2], [3, 4]] + [[5, 6], [7, 8]]?",
     "options": [
      "[[6, 8], [10, 12]]",
      "[[5, 12], [21, 32]]",
      "[[4, 4], [4, 4]]",
      "[[6, 8], [10, 11]]"
     ],
     "answer": "[[6, 8], [10, 12]]",
     "explanation": "Adding corresponding entries: 1+5=6, 2+6=8, 3+7=10, 4+8=12, giving [[6, 8], [10, 12]].",
     "topic": "Matrix Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q24",
     "type": "written",
     "prompt": "Subtract [[5, 3], [2, 1]] − [[2, 1], [0, 4]]. What is the entry in row 2, column 2 of the result?",
     "answer": "-3",
     "accept": [
      "−3"
     ],
     "explanation": "Subtracting corresponding entries in row 2: 2−0=2 for column 1, and 1−4=−3 for column 2.",
     "topic": "Matrix Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q25",
     "type": "mc",
     "prompt": "Multiplying every entry of a matrix by a single constant number is called:",
     "options": [
      "Scalar multiplication",
      "Matrix multiplication",
      "Matrix addition",
      "Determinant multiplication"
     ],
     "answer": "Scalar multiplication",
     "explanation": "Scalar multiplication multiplies each entry of a matrix by the same real number, called the scalar.",
     "topic": "Matrix Operations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q26",
     "type": "mc",
     "prompt": "Matrix A has dimensions 2 × 3 and matrix B has dimensions 3 × 4. What are the dimensions of the product AB?",
     "options": [
      "2 × 4",
      "3 × 3",
      "2 × 3",
      "4 × 2"
     ],
     "answer": "2 × 4",
     "explanation": "The product's dimensions come from the outer numbers: rows of A (2) by columns of B (4), since the inner numbers (3 and 3) match and cancel out.",
     "topic": "Matrix Operations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q27",
     "type": "tf",
     "prompt": "Two matrices can be multiplied only when the number of columns in the first matrix equals the number of rows in the second matrix.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Matrix multiplication requires the inner dimensions to match; otherwise, the rows and columns can't be paired up to multiply and sum.",
     "topic": "Matrix Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q28",
     "type": "written",
     "prompt": "Given A = [[1, 2], [3, 4]] and B = [[2, 0], [1, 2]], what is the entry in row 1, column 2 of the product AB?",
     "answer": "4",
     "accept": [],
     "explanation": "Row 1 of A times column 2 of B: 1(0) + 2(2) = 0 + 4 = 4.",
     "topic": "Matrix Operations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u2-q29",
     "type": "mc",
     "prompt": "The determinant of the 2×2 matrix [[a, b], [c, d]] is calculated as:",
     "options": [
      "ad − bc",
      "ac − bd",
      "ad + bc",
      "ab − cd"
     ],
     "answer": "ad − bc",
     "explanation": "For a 2×2 matrix, the determinant is the product of the main diagonal (a·d) minus the product of the other diagonal (b·c).",
     "topic": "Determinants",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u2-q30",
     "type": "written",
     "prompt": "Find the determinant of [[3, 5], [2, 4]].",
     "answer": "2",
     "accept": [],
     "explanation": "Using ad − bc: (3)(4) − (5)(2) = 12 − 10 = 2.",
     "topic": "Determinants",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q31",
     "type": "written",
     "prompt": "Find the determinant of [[−2, 6], [1, 4]].",
     "answer": "-14",
     "accept": [
      "−14"
     ],
     "explanation": "Using ad − bc: (−2)(4) − (6)(1) = −8 − 6 = −14.",
     "topic": "Determinants",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q32",
     "type": "tf",
     "prompt": "The determinant of a 2×2 matrix is always a positive number.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A determinant can be positive, negative, or zero; for example, [[−2, 6], [1, 4]] has determinant −14.",
     "topic": "Determinants",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u2-q33",
     "type": "mc",
     "prompt": "For the matrix [[4, 0], [0, 4]], the determinant equals:",
     "options": [
      "16",
      "8",
      "0",
      "4"
     ],
     "answer": "16",
     "explanation": "Using ad − bc: (4)(4) − (0)(0) = 16 − 0 = 16.",
     "topic": "Determinants",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg2-u3",
   "unit": 3,
   "title": "Quadratics and Complex Numbers",
   "summary": "Explore quadratic functions through vertex form, completing the square, and the quadratic formula, using the discriminant to predict the nature of a parabola's roots. Extend the number system with the imaginary unit i to find complex solutions, perform complex-number arithmetic, and solve quadratic inequalities.",
   "topics": [
    "Vertex Form & Graphing",
    "Completing the Square",
    "Quadratic Formula & Discriminant",
    "Imaginary Unit & Powers of i",
    "Complex Number Operations",
    "Complex Solutions & Conjugates",
    "Quadratic Inequalities"
   ],
   "terms": [
    {
     "term": "Vertex form",
     "definition": "y = a(x − h)² + k, a way of writing a quadratic where (h, k) is its highest or lowest point.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Vertex",
     "definition": "The highest or lowest point of a parabola, where the graph changes direction.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Axis of symmetry",
     "definition": "The vertical line x = h that divides a parabola into two mirror-image halves.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Standard form (quadratic)",
     "definition": "Writing a quadratic function as y = ax² + bx + c.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Factored form",
     "definition": "Writing a quadratic as y = a(x − p)(x − q), where p and q are its x-intercepts.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Parabola",
     "definition": "The U-shaped curve that is the graph of any quadratic function.",
     "topic": "Vertex Form & Graphing"
    },
    {
     "term": "Completing the square",
     "definition": "A method that rewrites ax² + bx + c in the form a(x − h)² + k by adding and subtracting a constant.",
     "topic": "Completing the Square"
    },
    {
     "term": "Perfect square trinomial",
     "definition": "A three-term polynomial that factors as a binomial squared, such as x² + 6x + 9 = (x + 3)².",
     "topic": "Completing the Square"
    },
    {
     "term": "Quadratic formula",
     "definition": "x = (−b ± √(b² − 4ac)) / (2a), used to solve any equation of the form ax² + bx + c = 0.",
     "topic": "Quadratic Formula & Discriminant"
    },
    {
     "term": "Discriminant",
     "definition": "The expression b² − 4ac, which reveals the number and type of solutions of a quadratic equation.",
     "topic": "Quadratic Formula & Discriminant"
    },
    {
     "term": "Roots (zeros)",
     "definition": "The solutions of f(x) = 0; the real ones are the x-intercepts of the graph.",
     "topic": "Quadratic Formula & Discriminant"
    },
    {
     "term": "Double root",
     "definition": "A repeated solution that occurs when a quadratic equation's discriminant equals zero.",
     "topic": "Quadratic Formula & Discriminant"
    },
    {
     "term": "Imaginary unit",
     "definition": "A number, denoted i, defined so that squaring it gives −1.",
     "topic": "Imaginary Unit & Powers of i"
    },
    {
     "term": "Powers of i pattern",
     "definition": "A repeating four-step pattern (i, −1, −i, 1) that results from raising the imaginary unit to increasing whole-number exponents.",
     "topic": "Imaginary Unit & Powers of i"
    },
    {
     "term": "Complex number",
     "definition": "A number of the form a + bi, where a and b are real numbers.",
     "topic": "Complex Number Operations"
    },
    {
     "term": "Real part",
     "definition": "The a-term in a complex number written a + bi.",
     "topic": "Complex Number Operations"
    },
    {
     "term": "Imaginary part",
     "definition": "The coefficient of i (the b-term) in a complex number written a + bi.",
     "topic": "Complex Number Operations"
    },
    {
     "term": "Pure imaginary number",
     "definition": "A complex number bi with real part zero and b ≠ 0, such as 5i.",
     "topic": "Complex Number Operations"
    },
    {
     "term": "Complex conjugate",
     "definition": "The complex number a − bi, paired with a + bi so that multiplying them eliminates the imaginary part.",
     "topic": "Complex Solutions & Conjugates"
    },
    {
     "term": "Complex conjugate root theorem",
     "definition": "If a polynomial has real coefficients and a + bi (b ≠ 0) is a root, then a − bi is also a root.",
     "topic": "Complex Solutions & Conjugates"
    },
    {
     "term": "Quadratic inequality",
     "definition": "A statement comparing ax² + bx + c (a ≠ 0) to zero using <, >, ≤ or ≥.",
     "topic": "Quadratic Inequalities"
    },
    {
     "term": "Boundary points",
     "definition": "The critical x-values, often the roots, that divide a number line into intervals when solving an inequality.",
     "topic": "Quadratic Inequalities"
    }
   ],
   "questions": [
    {
     "id": "alg2-u3-q1",
     "type": "mc",
     "prompt": "What is the vertex of the parabola given by y = (x − 3)² + 5?",
     "options": [
      "(3, 5)",
      "(−3, 5)",
      "(3, −5)",
      "(−3, −5)"
     ],
     "answer": "(3, 5)",
     "explanation": "In vertex form y = a(x − h)² + k, the vertex is (h, k); here h = 3 and k = 5, so the vertex is (3, 5).",
     "topic": "Vertex Form & Graphing",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q2",
     "type": "written",
     "prompt": "Write the vertex of the parabola y = 2(x + 4)² − 7 as an ordered pair.",
     "answer": "(-4, -7)",
     "accept": [
      "(-4,-7)",
      "-4,-7",
      "-4, -7"
     ],
     "explanation": "Rewriting as y = 2(x − (−4))² + (−7) shows h = −4 and k = −7, so the vertex is (−4, −7).",
     "topic": "Vertex Form & Graphing",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q3",
     "type": "tf",
     "prompt": "In vertex form y = a(x − h)² + k, if a < 0 the parabola opens upward.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A negative leading coefficient a makes the parabola open downward, not upward.",
     "topic": "Vertex Form & Graphing",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q4",
     "type": "mc",
     "prompt": "Write y = x² − 6x + 5 in vertex form by completing the square.",
     "options": [
      "y = (x − 3)² − 4",
      "y = (x − 3)² + 4",
      "y = (x + 3)² − 4",
      "y = (x − 6)² − 4"
     ],
     "answer": "y = (x − 3)² − 4",
     "explanation": "Half of −6 is −3, and (−3)² = 9, so x² − 6x + 9 − 9 + 5 = (x − 3)² − 4.",
     "topic": "Vertex Form & Graphing",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q5",
     "type": "mc",
     "prompt": "A ball's height in feet is modeled by h(t) = −16(t − 2)² + 64, where t is time in seconds. What does the vertex of this function represent?",
     "options": [
      "The ball reaches a maximum height of 64 feet at 2 seconds",
      "The ball reaches a minimum height of 64 feet at 2 seconds",
      "The ball hits the ground after 64 seconds",
      "The ball starts at a height of 64 feet"
     ],
     "answer": "The ball reaches a maximum height of 64 feet at 2 seconds",
     "explanation": "Since a = −16 < 0, the parabola opens downward, so the vertex (2, 64) is the maximum point: 64 ft at t = 2 s.",
     "topic": "Vertex Form & Graphing",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q6",
     "type": "written",
     "prompt": "Solve x² + 8x + 15 = 0 by completing the square. List both solutions.",
     "answer": "x = -3, -5",
     "accept": [
      "-3, -5",
      "-5, -3",
      "x=-3,-5",
      "x=-5,-3",
      "-3,-5",
      "x = -3, x = -5",
      "x = -5, x = -3",
      "-3 or -5",
      "-5 or -3",
      "x = -3 or x = -5",
      "x = -5 or x = -3",
      "x = -3 or -5",
      "-3 and -5",
      "-5 and -3"
     ],
     "explanation": "Adding (8/2)² = 16 gives (x + 4)² = 1, so x + 4 = ±1, yielding x = −3 or x = −5.",
     "topic": "Completing the Square",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q7",
     "type": "mc",
     "prompt": "To complete the square for x² + 10x, what constant should be added?",
     "options": [
      "25",
      "10",
      "5",
      "100"
     ],
     "answer": "25",
     "explanation": "The constant needed is (b/2)² = (10/2)² = 5² = 25.",
     "topic": "Completing the Square",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q8",
     "type": "tf",
     "prompt": "Completing the square on x² + bx requires adding (b/2)² to form a perfect square trinomial.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Adding (b/2)² makes x² + bx + (b/2)² factor as (x + b/2)², a perfect square trinomial.",
     "topic": "Completing the Square",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q9",
     "type": "mc",
     "prompt": "Which is the correct quadratic formula for solving ax² + bx + c = 0?",
     "options": [
      "x = (−b ± √(b² − 4ac)) / (2a)",
      "x = (b ± √(b² − 4ac)) / (2a)",
      "x = (−b ± √(b² + 4ac)) / (2a)",
      "x = (−b ± √(b² − 4ac)) / a"
     ],
     "answer": "x = (−b ± √(b² − 4ac)) / (2a)",
     "explanation": "The quadratic formula is x = (−b ± √(b² − 4ac)) / (2a); the distractors change the sign of b, the sign under the root, or drop the 2 in the denominator.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q10",
     "type": "written",
     "prompt": "Use the quadratic formula to solve 2x² − 4x − 6 = 0. List both solutions.",
     "answer": "x = 3, -1",
     "accept": [
      "3, -1",
      "-1, 3",
      "x=3,-1",
      "x=-1,3",
      "3,-1",
      "x = 3, x = -1",
      "x = -1, x = 3",
      "3 or -1",
      "-1 or 3",
      "x = 3 or x = -1",
      "x = -1 or x = 3",
      "x = 3 or -1",
      "3 and -1",
      "-1 and 3"
     ],
     "explanation": "The discriminant is (−4)² − 4(2)(−6) = 16 + 48 = 64, so x = (4 ± 8)/4, giving x = 3 or x = −1.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q11",
     "type": "mc",
     "prompt": "What does the discriminant of x² + 4x + 5 tell you about its roots?",
     "options": [
      "It has two complex conjugate roots",
      "It has two distinct real roots",
      "It has one repeated real root",
      "It has two distinct rational roots"
     ],
     "answer": "It has two complex conjugate roots",
     "explanation": "The discriminant is 4² − 4(1)(5) = 16 − 20 = −4, which is negative, so the equation has two complex conjugate roots.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q12",
     "type": "tf",
     "prompt": "If a quadratic equation's discriminant equals 0, the equation has two distinct real roots.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A discriminant of 0 gives exactly one repeated (double) real root, not two distinct roots.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q13",
     "type": "mc",
     "prompt": "A quadratic equation with integer coefficients has a discriminant of 49. What can you conclude about its roots?",
     "options": [
      "Two distinct rational real roots",
      "Two distinct irrational real roots",
      "One repeated real root",
      "Two complex conjugate roots"
     ],
     "answer": "Two distinct rational real roots",
     "explanation": "Since 49 > 0 the roots are real and distinct, and since 49 = 7² is a perfect square, √49 = 7 is rational; with integer coefficients, x = (−b ± 7)/(2a) is then rational.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q14",
     "type": "written",
     "prompt": "Find the discriminant of 3x² − 5x + 2 = 0.",
     "answer": "1",
     "accept": [
      "1.0"
     ],
     "explanation": "The discriminant is (−5)² − 4(3)(2) = 25 − 24 = 1.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q15",
     "type": "mc",
     "prompt": "If a quadratic equation's discriminant is negative, what is true about its graph?",
     "options": [
      "The parabola does not intersect the x-axis",
      "The parabola intersects the x-axis at two points",
      "The parabola is tangent to the x-axis at one point",
      "The parabola opens sideways"
     ],
     "answer": "The parabola does not intersect the x-axis",
     "explanation": "A negative discriminant means there are no real roots, so the parabola never crosses or touches the x-axis.",
     "topic": "Quadratic Formula & Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q16",
     "type": "written",
     "prompt": "Simplify i².",
     "answer": "-1",
     "accept": [
      "−1",
      "negative 1"
     ],
     "explanation": "By definition, i is the number whose square is −1, so i² = −1.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q17",
     "type": "mc",
     "prompt": "Simplify i³.",
     "options": [
      "-i",
      "i",
      "-1",
      "1"
     ],
     "answer": "-i",
     "explanation": "i³ = i² · i = (−1)(i) = −i.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q18",
     "type": "mc",
     "prompt": "Simplify i⁴.",
     "options": [
      "1",
      "-1",
      "i",
      "-i"
     ],
     "answer": "1",
     "explanation": "i⁴ = (i²)² = (−1)² = 1.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q19",
     "type": "tf",
     "prompt": "i⁵ is equal to i.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since i⁴ = 1, i⁵ = i⁴ · i = 1 · i = i, so the statement is true.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q20",
     "type": "mc",
     "prompt": "Simplify i¹⁷.",
     "options": [
      "i",
      "-i",
      "1",
      "-1"
     ],
     "answer": "i",
     "explanation": "Powers of i repeat every 4 exponents; since 17 = 4(4) + 1, i¹⁷ = i¹ = i.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u3-q21",
     "type": "written",
     "prompt": "Write √(−25) in terms of i.",
     "answer": "5i",
     "accept": [
      "i5",
      "5*i",
      "5 i"
     ],
     "explanation": "√(−25) = √25 · √(−1) = 5i.",
     "topic": "Imaginary Unit & Powers of i",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q22",
     "type": "mc",
     "prompt": "Add (3 + 2i) + (−5 + 7i).",
     "options": [
      "-2 + 9i",
      "8 + 9i",
      "-8 + 9i",
      "-2 - 9i"
     ],
     "answer": "-2 + 9i",
     "explanation": "Add real parts: 3 + (−5) = −2; add imaginary parts: 2 + 7 = 9; the sum is −2 + 9i.",
     "topic": "Complex Number Operations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q23",
     "type": "written",
     "prompt": "Subtract: (7 − 3i) − (2 − 8i).",
     "answer": "5+5i",
     "accept": [
      "5 + 5i"
     ],
     "explanation": "Subtract real parts: 7 − 2 = 5; subtract imaginary parts: −3 − (−8) = 5; the result is 5 + 5i.",
     "topic": "Complex Number Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q24",
     "type": "mc",
     "prompt": "Multiply (2 + 3i)(1 − 4i).",
     "options": [
      "14 - 5i",
      "2 - 5i",
      "14 + 5i",
      "-10 - 5i"
     ],
     "answer": "14 - 5i",
     "explanation": "(2+3i)(1−4i) = 2 − 8i + 3i − 12i² = 2 − 5i − 12(−1) = 2 − 5i + 12 = 14 − 5i.",
     "topic": "Complex Number Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q25",
     "type": "written",
     "prompt": "Multiply: i(4 − 3i).",
     "answer": "3+4i",
     "accept": [
      "3 + 4i"
     ],
     "explanation": "i(4 − 3i) = 4i − 3i² = 4i − 3(−1) = 3 + 4i.",
     "topic": "Complex Number Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q26",
     "type": "tf",
     "prompt": "The product of a complex number and its conjugate is always a real number.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "For a + bi, the product with its conjugate a − bi is (a + bi)(a − bi) = a² + b², which is always real.",
     "topic": "Complex Number Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q27",
     "type": "mc",
     "prompt": "Solve x² + 9 = 0.",
     "options": [
      "x = ±3i",
      "x = ±9i",
      "x = ±3",
      "x = 3i only"
     ],
     "answer": "x = ±3i",
     "explanation": "x² = −9, so x = ±√(−9) = ±3i.",
     "topic": "Complex Solutions & Conjugates",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u3-q28",
     "type": "written",
     "prompt": "Solve x² + 4 = 0. List both solutions.",
     "answer": "x = 2i, -2i",
     "accept": [
      "2i, -2i",
      "-2i, 2i",
      "±2i",
      "x=±2i",
      "x = -2i, 2i",
      "2i,-2i",
      "x = 2i, x = -2i",
      "x = -2i, x = 2i",
      "2i or -2i",
      "-2i or 2i",
      "x = 2i or x = -2i",
      "x = -2i or x = 2i",
      "x = 2i or -2i",
      "+-2i",
      "x = +-2i",
      "+/-2i",
      "x = +/-2i",
      "2i and -2i"
     ],
     "explanation": "x² = −4, so x = ±√(−4) = ±2i.",
     "topic": "Complex Solutions & Conjugates",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q29",
     "type": "mc",
     "prompt": "Solve x² − 2x + 5 = 0 using the quadratic formula.",
     "options": [
      "x = 1 ± 2i",
      "x = 2 ± 4i",
      "x = 1 ± 4i",
      "x = -1 ± 2i"
     ],
     "answer": "x = 1 ± 2i",
     "explanation": "The discriminant is (−2)² − 4(1)(5) = 4 − 20 = −16, so x = (2 ± √−16)/2 = (2 ± 4i)/2 = 1 ± 2i.",
     "topic": "Complex Solutions & Conjugates",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u3-q30",
     "type": "mc",
     "prompt": "A quadratic equation with real coefficients has 3 + 2i as one root. What must the other root be?",
     "options": [
      "3 - 2i",
      "-3 + 2i",
      "-3 - 2i",
      "2 + 3i"
     ],
     "answer": "3 - 2i",
     "explanation": "Non-real roots of a quadratic with real coefficients occur in conjugate pairs, so the other root is 3 − 2i.",
     "topic": "Complex Solutions & Conjugates",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q31",
     "type": "tf",
     "prompt": "A quadratic equation with real coefficients can have exactly one non-real complex root.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Non-real roots of a quadratic with real coefficients always occur in conjugate pairs, so having just one is impossible.",
     "topic": "Complex Solutions & Conjugates",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u3-q32",
     "type": "mc",
     "prompt": "Solve the inequality x² − x − 6 > 0.",
     "options": [
      "x < −2 or x > 3",
      "−2 < x < 3",
      "x ≤ −2 or x ≥ 3",
      "x < 3 or x > −2"
     ],
     "answer": "x < −2 or x > 3",
     "explanation": "Factoring gives (x − 3)(x + 2) > 0 with critical points x = −2 and x = 3; testing intervals shows the product is positive when x < −2 or x > 3.",
     "topic": "Quadratic Inequalities",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u3-q33",
     "type": "mc",
     "prompt": "A company's profit is modeled by P(x) = −(x − 50)² + 900, where x is units sold (hundreds). For which values of x is the company profitable, i.e. P(x) > 0?",
     "options": [
      "20 < x < 80",
      "−30 < x < 30",
      "0 < x < 100",
      "20 < x < 50"
     ],
     "answer": "20 < x < 80",
     "explanation": "Setting P(x) > 0 gives (x − 50)² < 900, so |x − 50| < 30, which means 20 < x < 80.",
     "topic": "Quadratic Inequalities",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg2-u4",
   "unit": 4,
   "title": "Polynomial Functions",
   "summary": "Explore how a polynomial's degree, leading coefficient, and zeros shape its graph, and learn to divide, factor, and solve polynomial equations with confidence. Master the Remainder, Factor, and Rational Root Theorems, the Fundamental Theorem of Algebra, and how to build a polynomial from its zeros.",
   "topics": [
    "Degree & End Behavior",
    "Zeros & Multiplicity",
    "Turning Points",
    "Polynomial Division",
    "Remainder & Factor Theorems",
    "Rational Roots & Fundamental Theorem",
    "Sum/Difference of Cubes & Building Polynomials"
   ],
   "terms": [
    {
     "term": "Polynomial function",
     "definition": "A function written as aₙxⁿ + ... + a₁x + a₀ with whole-number exponents and real coefficients.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "Degree (of a polynomial)",
     "definition": "The highest exponent of the variable appearing in the polynomial.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "Leading coefficient",
     "definition": "The number multiplying the highest-degree term of a polynomial.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "Standard form (polynomial)",
     "definition": "Writing a polynomial's terms in order from highest degree to lowest degree.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "End behavior",
     "definition": "The trend of a graph's y-values as x approaches +∞ or −∞.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "Leading Coefficient Test",
     "definition": "Predicts end behavior from whether the degree is even or odd and the sign of the highest-degree term's coefficient.",
     "topic": "Degree & End Behavior"
    },
    {
     "term": "Zero of a function",
     "definition": "An x-value that makes the function's output equal 0.",
     "topic": "Zeros & Multiplicity"
    },
    {
     "term": "Multiplicity",
     "definition": "The number of times a zero's linear factor repeats in a polynomial.",
     "topic": "Zeros & Multiplicity"
    },
    {
     "term": "Repeated zero",
     "definition": "A solution whose corresponding factor appears more than once in a polynomial.",
     "topic": "Zeros & Multiplicity"
    },
    {
     "term": "Even multiplicity behavior",
     "definition": "At such a solution, the graph touches the x-axis and bounces back instead of crossing.",
     "topic": "Zeros & Multiplicity"
    },
    {
     "term": "Odd multiplicity behavior",
     "definition": "At such a zero, the graph crosses from one side of the x-axis to the other (flattening if the exponent is 3 or more).",
     "topic": "Zeros & Multiplicity"
    },
    {
     "term": "Turning point",
     "definition": "A point on a graph where it changes from increasing to decreasing or from decreasing to increasing.",
     "topic": "Turning Points"
    },
    {
     "term": "Local maximum",
     "definition": "A high point on a graph where it switches from increasing to decreasing.",
     "topic": "Turning Points"
    },
    {
     "term": "Local minimum",
     "definition": "A low point on a graph where it switches from decreasing to increasing.",
     "topic": "Turning Points"
    },
    {
     "term": "Maximum turning points rule",
     "definition": "A polynomial of degree n has at most n − 1 places where its graph changes direction.",
     "topic": "Turning Points"
    },
    {
     "term": "Long division (of polynomials)",
     "definition": "Dividing one polynomial by another by repeatedly matching and subtracting leading terms.",
     "topic": "Polynomial Division"
    },
    {
     "term": "Synthetic division",
     "definition": "A shortcut for dividing a polynomial by a linear expression (x − c) using only coefficients.",
     "topic": "Polynomial Division"
    },
    {
     "term": "Depressed polynomial",
     "definition": "The quotient left over after dividing a known factor out of a polynomial, one degree lower than the original.",
     "topic": "Polynomial Division"
    },
    {
     "term": "Remainder Theorem",
     "definition": "Dividing p(x) by (x − c) leaves a remainder equal to p(c).",
     "topic": "Remainder & Factor Theorems"
    },
    {
     "term": "Factor Theorem",
     "definition": "(x − c) divides evenly into p(x) exactly when p(c) = 0.",
     "topic": "Remainder & Factor Theorems"
    },
    {
     "term": "Rational Root Theorem",
     "definition": "With integer coefficients, any fractional solution p/q in lowest terms has p dividing the constant and q dividing the leading coefficient.",
     "topic": "Rational Roots & Fundamental Theorem"
    },
    {
     "term": "Fundamental Theorem of Algebra",
     "definition": "A degree-n polynomial has exactly n complex solutions, counting repeats.",
     "topic": "Rational Roots & Fundamental Theorem"
    },
    {
     "term": "Complex conjugate pair",
     "definition": "The numbers a + bi and a − bi (b ≠ 0), which occur together as zeros of real-coefficient polynomials.",
     "topic": "Rational Roots & Fundamental Theorem"
    },
    {
     "term": "Sum of cubes formula",
     "definition": "a³ + b³ = (a + b)(a² − ab + b²)",
     "topic": "Sum/Difference of Cubes & Building Polynomials"
    },
    {
     "term": "Difference of cubes formula",
     "definition": "a³ − b³ = (a − b)(a² + ab + b²)",
     "topic": "Sum/Difference of Cubes & Building Polynomials"
    },
    {
     "term": "Irreducible quadratic factor",
     "definition": "A degree-2 factor with no real zeros (negative discriminant), such as x² + 1, that cannot be factored over the reals.",
     "topic": "Sum/Difference of Cubes & Building Polynomials"
    }
   ],
   "questions": [
    {
     "id": "alg2-u4-q1",
     "type": "mc",
     "prompt": "What is the degree of the polynomial p(x) = 5x⁴ − 3x² + 7x − 1?",
     "options": [
      "4",
      "2",
      "7",
      "1"
     ],
     "answer": "4",
     "explanation": "The degree of a polynomial is its highest exponent, which is 4 from the term 5x⁴.",
     "topic": "Degree & End Behavior",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q2",
     "type": "mc",
     "prompt": "What is the leading coefficient of p(x) = −2x⁵ + 9x³ − x + 4?",
     "options": [
      "−2",
      "9",
      "5",
      "4"
     ],
     "answer": "−2",
     "explanation": "The leading coefficient multiplies the highest-degree term, x⁵, which is −2.",
     "topic": "Degree & End Behavior",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q3",
     "type": "mc",
     "prompt": "Which end behavior matches an odd-degree polynomial with a positive leading coefficient?",
     "options": [
      "Falls left, rises right",
      "Rises left, falls right",
      "Rises on both ends",
      "Falls on both ends"
     ],
     "answer": "Falls left, rises right",
     "explanation": "Odd degree sends the two ends in opposite directions, and a positive leading coefficient makes the right end rise, so the left end must fall.",
     "topic": "Degree & End Behavior",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q4",
     "type": "mc",
     "prompt": "A polynomial's graph falls to the left and falls to the right. Which description fits its degree and leading coefficient?",
     "options": [
      "Even degree, negative leading coefficient",
      "Even degree, positive leading coefficient",
      "Odd degree, negative leading coefficient",
      "Odd degree, positive leading coefficient"
     ],
     "answer": "Even degree, negative leading coefficient",
     "explanation": "Both ends going the same direction (down) means the degree is even, and ends pointing down means the leading coefficient is negative.",
     "topic": "Degree & End Behavior",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q5",
     "type": "mc",
     "prompt": "For p(x) = (x − 3)²(x + 1), what is the multiplicity of the zero x = 3?",
     "options": [
      "2",
      "1",
      "3",
      "0"
     ],
     "answer": "2",
     "explanation": "The exponent on the factor (x − 3) is 2, so the multiplicity of the zero x = 3 is 2.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q6",
     "type": "mc",
     "prompt": "A polynomial's graph touches the x-axis at x = −2 and bounces back without crossing. What can you conclude about the multiplicity of this zero?",
     "options": [
      "It is even",
      "It is odd",
      "It is exactly 1",
      "It cannot be determined"
     ],
     "answer": "It is even",
     "explanation": "A graph that touches and bounces at a zero, without crossing, always has even multiplicity there. An odd multiplicity, including 1, would make the graph cross.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q7",
     "type": "mc",
     "prompt": "For p(x) = (x + 4)(x − 1)³, does the graph cross or bounce off the x-axis at x = 1?",
     "options": [
      "Crosses, because the multiplicity 3 is odd",
      "Bounces, because the multiplicity 3 is odd",
      "Crosses, because the multiplicity 3 is even",
      "Bounces, because the multiplicity 1 is odd"
     ],
     "answer": "Crosses, because the multiplicity 3 is odd",
     "explanation": "The exponent on (x − 1) is 3, which is odd, so the graph crosses straight through the x-axis at x = 1.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q8",
     "type": "mc",
     "prompt": "What is the maximum possible number of turning points for a degree-5 polynomial?",
     "options": [
      "4",
      "5",
      "3",
      "6"
     ],
     "answer": "4",
     "explanation": "A degree-n polynomial has at most n − 1 turning points, so a degree-5 polynomial has at most 5 − 1 = 4.",
     "topic": "Turning Points",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q9",
     "type": "mc",
     "prompt": "A quartic (degree-4) polynomial's graph is observed to have exactly 3 turning points. Is this possible?",
     "options": [
      "Yes, since 3 ≤ 4 − 1",
      "No, a quartic must have exactly 4 turning points",
      "No, a quartic can have at most 2 turning points",
      "Yes, since every quartic has exactly 3 turning points"
     ],
     "answer": "Yes, since 3 ≤ 4 − 1",
     "explanation": "A degree-4 polynomial can have up to 4 − 1 = 3 turning points, so having exactly 3 is possible.",
     "topic": "Turning Points",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q10",
     "type": "mc",
     "prompt": "Divide x² + 5x + 6 by (x + 2) using synthetic division. What is the quotient?",
     "options": [
      "x + 3",
      "x + 2",
      "x + 6",
      "x − 3"
     ],
     "answer": "x + 3",
     "explanation": "Using c = −2 with coefficients 1, 5, 6: bring down 1, then 1(−2) + 5 = 3, then 3(−2) + 6 = 0 remainder, giving quotient coefficients 1 and 3, so x + 3.",
     "topic": "Polynomial Division",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q11",
     "type": "mc",
     "prompt": "When 2x³ − 3x² + 4x − 1 is divided by (x − 1), what is the remainder?",
     "options": [
      "2",
      "0",
      "−1",
      "4"
     ],
     "answer": "2",
     "explanation": "By the Remainder Theorem, the remainder equals p(1) = 2(1)³ − 3(1)² + 4(1) − 1 = 2 − 3 + 4 − 1 = 2.",
     "topic": "Polynomial Division",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q12",
     "type": "mc",
     "prompt": "Using long division, what is the quotient when x³ − 2x² − 5x + 6 is divided by x² − x − 6?",
     "options": [
      "x − 1",
      "x + 1",
      "x − 3",
      "x + 2"
     ],
     "answer": "x − 1",
     "explanation": "x³ ÷ x² = x, and subtracting x(x² − x − 6) = x³ − x² − 6x leaves −x² + x + 6. Then −x² ÷ x² = −1, and subtracting −1(x² − x − 6) leaves 0, so the quotient is x − 1. Check: (x − 1)(x² − x − 6) = x³ − 2x² − 5x + 6.",
     "topic": "Polynomial Division",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q13",
     "type": "mc",
     "prompt": "Given p(x) = x³ − 4x² + x + 6, it is known that p(3) = 0. Which of these must be a factor of p(x)?",
     "options": [
      "(x − 3)",
      "(x + 3)",
      "(x − 4)",
      "(x + 6)"
     ],
     "answer": "(x − 3)",
     "explanation": "By the Factor Theorem, since p(3) = 0, (x − 3) must be a factor of p(x); checking: 3³ − 4(3)² + 3 + 6 = 27 − 36 + 3 + 6 = 0.",
     "topic": "Remainder & Factor Theorems",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q14",
     "type": "mc",
     "prompt": "According to the Rational Root Theorem, which of these is a possible rational zero of p(x) = 2x³ − 5x² + x + 6?",
     "options": [
      "3/2",
      "5/2",
      "1/4",
      "6/5"
     ],
     "answer": "3/2",
     "explanation": "Possible rational zeros are ± (a factor of 6)/(a factor of 2); 3/2 fits since 3 divides 6 and 2 divides 2, while the other options use numbers or denominators that are not factors of 6 or 2.",
     "topic": "Rational Roots & Fundamental Theorem",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q15",
     "type": "mc",
     "prompt": "A degree-4 polynomial with real coefficients has zeros 2, −1, and 3 + i. What must be its fourth zero?",
     "options": [
      "3 − i",
      "3 + i",
      "−3 − i",
      "i"
     ],
     "answer": "3 − i",
     "explanation": "The Fundamental Theorem of Algebra guarantees 4 zeros total, and complex zeros of real-coefficient polynomials occur in conjugate pairs, so 3 + i requires its conjugate 3 − i.",
     "topic": "Rational Roots & Fundamental Theorem",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q16",
     "type": "mc",
     "prompt": "Which expression correctly factors x³ + 8?",
     "options": [
      "(x + 2)(x² − 2x + 4)",
      "(x + 2)(x² + 2x + 4)",
      "(x − 2)(x² + 2x + 4)",
      "(x + 2)³"
     ],
     "answer": "(x + 2)(x² − 2x + 4)",
     "explanation": "Using a³ + b³ = (a + b)(a² − ab + b²) with a = x and b = 2: x³ + 8 = (x + 2)(x² − 2x + 4).",
     "topic": "Sum/Difference of Cubes & Building Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q17",
     "type": "tf",
     "prompt": "A polynomial's leading coefficient is the coefficient of the term with the lowest degree.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The leading coefficient belongs to the highest-degree term, not the lowest-degree term.",
     "topic": "Degree & End Behavior",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q18",
     "type": "tf",
     "prompt": "A polynomial of even degree with a positive leading coefficient rises on both the left and the right.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "With even degree, both ends point the same way, and a positive leading coefficient makes that direction up, so the graph rises on both ends (like y = x²).",
     "topic": "Degree & End Behavior",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q19",
     "type": "tf",
     "prompt": "If a zero of a polynomial has odd multiplicity, the graph crosses the x-axis at that zero.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Odd multiplicity always produces a crossing straight through the x-axis at that zero.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q20",
     "type": "tf",
     "prompt": "A zero with multiplicity 4 causes the graph to cross the x-axis at that point.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Multiplicity 4 is even, so the graph touches and bounces off the x-axis there instead of crossing.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q21",
     "type": "tf",
     "prompt": "Synthetic division can be used to divide any polynomial by any other polynomial, no matter its degree.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Synthetic division only works when dividing by a linear expression of the form (x − c).",
     "topic": "Polynomial Division",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q22",
     "type": "tf",
     "prompt": "The Remainder Theorem states that dividing p(x) by (x − c) gives a remainder equal to p(c).",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is exactly the statement of the Remainder Theorem.",
     "topic": "Remainder & Factor Theorems",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q23",
     "type": "tf",
     "prompt": "The Fundamental Theorem of Algebra guarantees that a degree-6 polynomial has exactly 6 real zeros.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "It guarantees 6 complex zeros counting multiplicity, but some or all of those zeros may be non-real.",
     "topic": "Rational Roots & Fundamental Theorem",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q24",
     "type": "tf",
     "prompt": "The difference of cubes formula is a³ − b³ = (a − b)(a² + ab + b²).",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Expanding (a − b)(a² + ab + b²) gives a³ − b³, confirming the identity.",
     "topic": "Sum/Difference of Cubes & Building Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q25",
     "type": "written",
     "prompt": "What is the degree of p(x) = 7 − 4x + x⁵ − 2x³?",
     "answer": "5",
     "accept": [
      "five"
     ],
     "explanation": "Written in standard form, p(x) = x⁵ − 2x³ − 4x + 7, and the highest exponent present is 5.",
     "topic": "Degree & End Behavior",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q26",
     "type": "written",
     "prompt": "What is the leading coefficient of p(x) = 4 − x² + 3x − 5x³?",
     "answer": "−5",
     "accept": [
      "-5",
      "negative 5",
      "negative five"
     ],
     "explanation": "In standard form, p(x) = −5x³ − x² + 3x + 4. The highest-degree term is −5x³, so the leading coefficient is −5, not the first number written (4).",
     "topic": "Degree & End Behavior",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u4-q27",
     "type": "written",
     "prompt": "For p(x) = (x + 5)(x − 2)⁴, what is the multiplicity of the zero x = 2?",
     "answer": "4",
     "accept": [
      "four"
     ],
     "explanation": "The exponent on the factor (x − 2) is 4, so that is the zero's multiplicity.",
     "topic": "Zeros & Multiplicity",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q28",
     "type": "written",
     "prompt": "A degree-6 polynomial has the maximum possible number of turning points. How many turning points does it have?",
     "answer": "5",
     "accept": [
      "five"
     ],
     "explanation": "The maximum number of turning points is degree − 1, so 6 − 1 = 5.",
     "topic": "Turning Points",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q29",
     "type": "written",
     "prompt": "When x³ + 2x² − 5x − 6 is divided by (x + 1), what is the remainder?",
     "answer": "0",
     "accept": [
      "zero"
     ],
     "explanation": "By the Remainder Theorem, the remainder equals p(−1) = (−1)³ + 2(−1)² − 5(−1) − 6 = −1 + 2 + 5 − 6 = 0.",
     "topic": "Polynomial Division",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q30",
     "type": "written",
     "prompt": "For what value of k is (x − 2) a factor of p(x) = x³ + kx² − 4x + 4?",
     "answer": "−1",
     "accept": [
      "-1",
      "k = -1",
      "k=-1",
      "k = −1",
      "k=−1",
      "negative 1",
      "negative one"
     ],
     "explanation": "By the Factor Theorem, p(2) must equal 0: 2³ + k(2)² − 4(2) + 4 = 8 + 4k − 8 + 4 = 4k + 4 = 0, so k = −1. Check: x³ − x² − 4x + 4 = (x − 1)(x − 2)(x + 2).",
     "topic": "Remainder & Factor Theorems",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u4-q31",
     "type": "written",
     "prompt": "According to the Rational Root Theorem, how many possible rational zeros (counting both positive and negative) exist for p(x) = 3x³ + x − 10?",
     "answer": "16",
     "accept": [
      "sixteen"
     ],
     "explanation": "The factors of the constant 10 are 1, 2, 5, 10 and the factors of the leading coefficient 3 are 1, 3. That gives 8 distinct positive candidates (1, 2, 5, 10, 1/3, 2/3, 5/3, 10/3), and doubling for ± gives 16.",
     "topic": "Rational Roots & Fundamental Theorem",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u4-q32",
     "type": "written",
     "prompt": "A cubic (degree-3) polynomial with leading coefficient 1 has zeros −2, 1, and 3. What is p(0), its y-intercept?",
     "answer": "6",
     "accept": [
      "six",
      "y = 6",
      "y=6",
      "(0, 6)",
      "(0,6)"
     ],
     "explanation": "p(x) = (x + 2)(x − 1)(x − 3), so p(0) = (0 + 2)(0 − 1)(0 − 3) = (2)(−1)(−3) = 6.",
     "topic": "Sum/Difference of Cubes & Building Polynomials",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg2-u5",
   "unit": 5,
   "title": "Radicals and Rational Exponents",
   "summary": "Learn to evaluate and simplify nth roots and rational exponents, apply exponent rules, and rationalize radical denominators. You'll also solve radical equations while checking for extraneous solutions and study the graphs of square root and cube root functions.",
   "topics": [
    "Roots and Radical Notation",
    "Rational Exponents",
    "Exponent Rules",
    "Simplifying Radicals",
    "Rationalizing Denominators",
    "Radical Equations",
    "Radical Functions (Graphs)"
   ],
   "terms": [
    {
     "term": "Radicand",
     "definition": "The number or expression located under a radical symbol.",
     "topic": "Roots and Radical Notation"
    },
    {
     "term": "Index",
     "definition": "The small number written above and to the left of a radical sign showing which root to take.",
     "topic": "Roots and Radical Notation"
    },
    {
     "term": "Principal root",
     "definition": "The root a radical sign denotes: the nonnegative root for even indexes, the single real root for odd indexes.",
     "topic": "Roots and Radical Notation"
    },
    {
     "term": "nth root",
     "definition": "A number b such that bⁿ = a, meaning b used as a factor n times gives a.",
     "topic": "Roots and Radical Notation"
    },
    {
     "term": "Rational exponent",
     "definition": "An exponent expressed as a fraction, such as m/n, linking powers and roots.",
     "topic": "Rational Exponents"
    },
    {
     "term": "Unit-fraction exponent rule",
     "definition": "x^(1/n) = ⁿ√x; an exponent of 1 over n means taking the nth root.",
     "topic": "Rational Exponents"
    },
    {
     "term": "Root-then-power rule",
     "definition": "x^(m/n) = (ⁿ√x)^m = ⁿ√(xᵐ): take the nth root, then raise it to the mth power.",
     "topic": "Rational Exponents"
    },
    {
     "term": "Product of powers rule",
     "definition": "xᵃ · xᵇ = x^(a+b), used when multiplying powers that share a base.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Quotient of powers rule",
     "definition": "xᵃ ÷ xᵇ = x^(a−b), used when dividing powers that share a base.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Power of a power rule",
     "definition": "(xᵃ)ᵇ = x^(ab), used when raising a power to another power.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Negative exponent rule",
     "definition": "x^(−a) = 1/xᵃ, converting a negative exponent into a reciprocal with a positive exponent.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Zero exponent rule",
     "definition": "Any nonzero base raised to the zero power equals 1.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Simplified radical form",
     "definition": "A radical expression with no perfect-power factors left inside the root and no radicals in the denominator.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Like radicals",
     "definition": "Radical expressions sharing the same index and the same radicand, which can be combined by adding or subtracting coefficients.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Product property of radicals",
     "definition": "ⁿ√a · ⁿ√b = ⁿ√(ab), allowing two roots of the same index to be combined into one.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Quotient property of radicals",
     "definition": "ⁿ√a ÷ ⁿ√b = ⁿ√(a/b), allowing a single root of a quotient to be split into two roots.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Rationalizing the denominator",
     "definition": "The process of rewriting a fraction so that no radical remains in its denominator.",
     "topic": "Rationalizing Denominators"
    },
    {
     "term": "Conjugate",
     "definition": "An expression formed by reversing the sign between two terms, used to eliminate radicals from a binomial denominator.",
     "topic": "Rationalizing Denominators"
    },
    {
     "term": "Radical equation",
     "definition": "An equation in which a variable appears inside a radical symbol.",
     "topic": "Radical Equations"
    },
    {
     "term": "Extraneous solution",
     "definition": "A value produced while solving an equation that fails to satisfy the original equation.",
     "topic": "Radical Equations"
    },
    {
     "term": "Isolating the radical",
     "definition": "Rearranging an equation so the radical term stands alone on one side before raising both sides to a power.",
     "topic": "Radical Equations"
    },
    {
     "term": "Square root function",
     "definition": "The function f(x) = √x, defined only for nonnegative inputs.",
     "topic": "Radical Functions (Graphs)"
    },
    {
     "term": "Cube root function",
     "definition": "The function f(x) = ∛x, defined for every real number input.",
     "topic": "Radical Functions (Graphs)"
    },
    {
     "term": "Domain restriction",
     "definition": "A limitation on the allowed input values of a function, often required to keep a radical expression real.",
     "topic": "Radical Functions (Graphs)"
    }
   ],
   "questions": [
    {
     "id": "alg2-u5-q1",
     "type": "mc",
     "prompt": "What is the index of the radical ∛27?",
     "options": [
      "2",
      "3",
      "27",
      "9"
     ],
     "answer": "3",
     "explanation": "The small number written before the radical symbol is the index; in ∛27 it is 3, meaning “cube root.”",
     "topic": "Roots and Radical Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q2",
     "type": "mc",
     "prompt": "What is ⁴√81?",
     "options": [
      "3",
      "9",
      "20.25",
      "27"
     ],
     "answer": "3",
     "explanation": "3⁴ = 3 · 3 · 3 · 3 = 81, so the principal fourth root of 81 is 3. The distractor 9 is the square root of 81, and 9² = 81, not 9⁴.",
     "topic": "Roots and Radical Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q3",
     "type": "mc",
     "prompt": "What is ∛(−64)?",
     "options": [
      "−4",
      "4",
      "−8",
      "It is not a real number"
     ],
     "answer": "−4",
     "explanation": "(−4)³ = −64, and odd-index roots of negative numbers are real, so ∛(−64) = −4.",
     "topic": "Roots and Radical Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q4",
     "type": "mc",
     "prompt": "Which expression is equivalent to x^(1/3)?",
     "options": [
      "∛x",
      "x³",
      "1/x³",
      "3x"
     ],
     "answer": "∛x",
     "explanation": "By definition, x^(1/n) means the nth root of x, so x^(1/3) = ∛x.",
     "topic": "Rational Exponents",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q5",
     "type": "mc",
     "prompt": "Evaluate 8^(2/3).",
     "options": [
      "4",
      "16",
      "6",
      "64"
     ],
     "answer": "4",
     "explanation": "8^(2/3) = (∛8)² = 2² = 4.",
     "topic": "Rational Exponents",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q6",
     "type": "mc",
     "prompt": "Evaluate 27^(−2/3).",
     "options": [
      "1/9",
      "9",
      "−9",
      "1/3"
     ],
     "answer": "1/9",
     "explanation": "27^(2/3) = (∛27)² = 3² = 9, and a negative exponent gives the reciprocal, so 27^(−2/3) = 1/9.",
     "topic": "Rational Exponents",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q7",
     "type": "mc",
     "prompt": "Simplify: x^(1/2) · x^(1/3)",
     "options": [
      "x^(5/6)",
      "x^(1/6)",
      "x^(1/5)",
      "x^(2/3)"
     ],
     "answer": "x^(5/6)",
     "explanation": "Multiplying powers with the same base adds the exponents: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q8",
     "type": "mc",
     "prompt": "Simplify: (x^(2/3))^(3/4)",
     "options": [
      "x^(1/2)",
      "x^(1/6)",
      "x^(17/12)",
      "x²"
     ],
     "answer": "x^(1/2)",
     "explanation": "Raising a power to a power multiplies the exponents: (2/3)(3/4) = 6/12 = 1/2.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q9",
     "type": "mc",
     "prompt": "Simplify: x^(3/4) ÷ x^(1/4)",
     "options": [
      "x^(1/2)",
      "x",
      "x^(3/16)",
      "x²"
     ],
     "answer": "x^(1/2)",
     "explanation": "Dividing powers with the same base subtracts the exponents: 3/4 − 1/4 = 2/4 = 1/2.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q10",
     "type": "mc",
     "prompt": "Simplify √50.",
     "options": [
      "5√2",
      "2√5",
      "10√5",
      "25√2"
     ],
     "answer": "5√2",
     "explanation": "50 = 25 · 2 and √25 = 5, so √50 = 5√2.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q11",
     "type": "mc",
     "prompt": "Simplify ∛54.",
     "options": [
      "3∛2",
      "2∛27",
      "27∛2",
      "9∛6"
     ],
     "answer": "3∛2",
     "explanation": "54 = 27 · 2 and ∛27 = 3, so ∛54 = 3∛2.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q12",
     "type": "mc",
     "prompt": "Simplify: √48 + √27",
     "options": [
      "7√3",
      "√75",
      "12√3",
      "7√75"
     ],
     "answer": "7√3",
     "explanation": "√48 = 4√3 and √27 = 3√3 (since 48 = 16·3 and 27 = 9·3), so 4√3 + 3√3 = 7√3.",
     "topic": "Simplifying Radicals",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q13",
     "type": "mc",
     "prompt": "Rationalize the denominator: 1/√5",
     "options": [
      "√5/5",
      "1/5",
      "5/√5",
      "√5"
     ],
     "answer": "√5/5",
     "explanation": "Multiply numerator and denominator by √5: (1·√5)/(√5·√5) = √5/5.",
     "topic": "Rationalizing Denominators",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q14",
     "type": "mc",
     "prompt": "Rationalize the denominator of 3/(2 + √3) using the conjugate.",
     "options": [
      "6 − 3√3",
      "6 + 3√3",
      "3 − √3",
      "(6 − 3√3)/5"
     ],
     "answer": "6 − 3√3",
     "explanation": "Multiply by the conjugate (2 − √3): the denominator becomes 2² − (√3)² = 4 − 3 = 1, and the numerator becomes 3(2 − √3) = 6 − 3√3.",
     "topic": "Rationalizing Denominators",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q15",
     "type": "mc",
     "prompt": "What is the solution set of √(x + 3) = x − 3?",
     "options": [
      "x = 6 only",
      "x = 1 only",
      "x = 1 and x = 6",
      "No real solution"
     ],
     "answer": "x = 6 only",
     "explanation": "Squaring gives x + 3 = x² − 6x + 9, so x² − 7x + 6 = (x − 1)(x − 6) = 0 and x = 1 or x = 6. x = 6 checks (√9 = 3 = 6 − 3), but x = 1 gives √4 = 2 while 1 − 3 = −2, so x = 1 is extraneous.",
     "topic": "Radical Equations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q16",
     "type": "mc",
     "prompt": "What is the domain of f(x) = √(x − 4)?",
     "options": [
      "x ≥ 4",
      "x ≤ 4",
      "x ≥ −4",
      "All real numbers"
     ],
     "answer": "x ≥ 4",
     "explanation": "The radicand must be nonnegative, so x − 4 ≥ 0, which gives x ≥ 4.",
     "topic": "Radical Functions (Graphs)",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q17",
     "type": "mc",
     "prompt": "What is the domain of g(x) = ∛(x − 4)?",
     "options": [
      "All real numbers",
      "x ≥ 4",
      "x ≤ 4",
      "x ≠ 4"
     ],
     "answer": "All real numbers",
     "explanation": "Cube roots are defined for negative, zero, and positive radicands, so g(x) has no domain restriction.",
     "topic": "Radical Functions (Graphs)",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q18",
     "type": "mc",
     "prompt": "The radius of a sphere with volume V is given by r = (3V/(4π))^(1/3). If V = 36π cubic units, what is r?",
     "options": [
      "3",
      "9",
      "27",
      "6"
     ],
     "answer": "3",
     "explanation": "3V/(4π) = 3(36π)/(4π) = 108π/4π = 27, and 27^(1/3) = 3, so r = 3.",
     "topic": "Rational Exponents",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q19",
     "type": "mc",
     "prompt": "Which function's graph lies entirely in the region x ≥ 0, y ≥ 0, with no points for negative x or negative y?",
     "options": [
      "f(x) = √x",
      "f(x) = ∛x",
      "f(x) = x",
      "f(x) = |x|"
     ],
     "answer": "f(x) = √x",
     "explanation": "The square root function is defined only for x ≥ 0 and always outputs nonnegative values, unlike ∛x, x, or |x|, which all include points outside that region.",
     "topic": "Radical Functions (Graphs)",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q20",
     "type": "tf",
     "prompt": "The principal square root of a positive number is always positive.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "By definition, the principal root is the nonnegative root, so for a positive radicand it is positive.",
     "topic": "Roots and Radical Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q21",
     "type": "tf",
     "prompt": "⁴√(−16) = −2",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "(−2)⁴ = 16, not −16. No real number raised to an even power is negative, so ⁴√(−16) is not a real number.",
     "topic": "Roots and Radical Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q22",
     "type": "tf",
     "prompt": "By definition, x^(m/n) equals (ⁿ√x) raised to the m power.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This matches the standard definition of a rational exponent: x^(m/n) = (ⁿ√x)^m.",
     "topic": "Rational Exponents",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q23",
     "type": "tf",
     "prompt": "For any nonzero value of x, x⁰ equals 0.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Any nonzero base raised to the zero power equals 1, not 0, so the statement is false.",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q24",
     "type": "tf",
     "prompt": "√18 simplifies to 3√2.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "18 = 9 · 2 and √9 = 3, so √18 = 3√2, confirming the statement.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q25",
     "type": "tf",
     "prompt": "To rationalize 1/√7, you multiply the numerator and denominator by 7.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "You must multiply by √7, not 7, so that √7 · √7 = 7 clears the radical; multiplying by 7 alone leaves a radical in the denominator.",
     "topic": "Rationalizing Denominators",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q26",
     "type": "tf",
     "prompt": "Every value obtained after squaring both sides of a radical equation is guaranteed to solve the original equation.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Squaring both sides can introduce extraneous solutions, so every candidate must be checked in the original equation.",
     "topic": "Radical Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q27",
     "type": "tf",
     "prompt": "The graph of g(x) = √(x + 2) is the graph of f(x) = √x shifted 2 units to the left.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Replacing x with x + 2 moves a graph 2 units left. The starting point moves from (0, 0) to (−2, 0), because x + 2 ≥ 0 means x ≥ −2.",
     "topic": "Radical Functions (Graphs)",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q28",
     "type": "written",
     "prompt": "Evaluate √121.",
     "answer": "11",
     "accept": [
      "11.0"
     ],
     "explanation": "11 · 11 = 121, so √121 = 11.",
     "topic": "Roots and Radical Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u5-q29",
     "type": "written",
     "prompt": "Evaluate ⁵√(−32).",
     "answer": "-2",
     "accept": [
      "−2",
      "-2.0",
      "−2.0"
     ],
     "explanation": "(−2)⁵ = (−2)(−2)(−2)(−2)(−2) = −32. An odd root of a negative number is real, so ⁵√(−32) = −2.",
     "topic": "Roots and Radical Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q30",
     "type": "written",
     "prompt": "Evaluate 4^(3/2).",
     "answer": "8",
     "accept": [
      "8.0"
     ],
     "explanation": "4^(3/2) = (√4)³ = 2³ = 8.",
     "topic": "Rational Exponents",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q31",
     "type": "written",
     "prompt": "Evaluate 32^(2/5).",
     "answer": "4",
     "accept": [
      "4.0"
     ],
     "explanation": "32^(1/5) = 2 because 2⁵ = 32, so 32^(2/5) = 2² = 4.",
     "topic": "Rational Exponents",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u5-q32",
     "type": "written",
     "prompt": "Evaluate 6^(2/5) · 6^(3/5).",
     "answer": "6",
     "accept": [
      "6.0"
     ],
     "explanation": "Add the exponents since the bases match: 2/5 + 3/5 = 1, so 6^(2/5) · 6^(3/5) = 6¹ = 6.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q33",
     "type": "written",
     "prompt": "√200 simplifies to a√2 for some whole number a. What is the value of a?",
     "answer": "10",
     "accept": [
      "a=10",
      "a = 10"
     ],
     "explanation": "200 = 100 · 2 and √100 = 10, so √200 = 10√2, meaning a = 10.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q34",
     "type": "written",
     "prompt": "What is the value of (5 + √2)(5 − √2)?",
     "answer": "23",
     "accept": [
      "23.0"
     ],
     "explanation": "Multiplying conjugates gives a² − b²: 5² − (√2)² = 25 − 2 = 23.",
     "topic": "Rationalizing Denominators",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q35",
     "type": "written",
     "prompt": "Solve for x: √(x + 5) = 6",
     "answer": "x = 31",
     "accept": [
      "31",
      "x=31"
     ],
     "explanation": "Square both sides: x + 5 = 36, so x = 31; checking, √(31 + 5) = √36 = 6, which confirms the solution.",
     "topic": "Radical Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u5-q36",
     "type": "written",
     "prompt": "Solve √(2x − 1) = x − 2. This equation has two candidate solutions after squaring, but one is extraneous. Give the valid solution.",
     "answer": "x = 5",
     "accept": [
      "5",
      "x=5"
     ],
     "explanation": "Squaring gives x² − 6x + 5 = 0, so x = 1 or x = 5; x = 1 gives √1 = 1 but x − 2 = −1 (fails), while x = 5 gives √9 = 3 and x − 2 = 3 (works), so x = 5 is the valid solution.",
     "topic": "Radical Equations",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg2-u6",
   "unit": 6,
   "title": "Exponential and Logarithmic Functions",
   "summary": "Explore exponential growth and decay, compound interest, and the special number e, then flip the script with logarithms — the inverse operation of exponentiation. Master the log properties, equation-solving strategies, and the deep two-way relationship between exponential and logarithmic functions.",
   "topics": [
    "Exponential Growth & Decay",
    "Compound Interest & e",
    "Logarithm Basics",
    "Log Properties",
    "Solving Exponential Equations",
    "Solving Logarithmic Equations",
    "Inverse Relationship (Exp & Log)"
   ],
   "terms": [
    {
     "term": "Exponential function",
     "definition": "A function of the form f(x) = a·b^x, where b > 0, b ≠ 1, and x is in the exponent",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Growth factor",
     "definition": "The base b > 1 in f(x) = a·b^x, the multiplier applied to the quantity each time period",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Decay factor",
     "definition": "The base 0 < b < 1 in f(x) = a·b^x, the fraction of the quantity remaining each period",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Growth rate",
     "definition": "The percent r in A = P(1 + r)^t that is added each period; r > 0 for increasing quantities",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Decay rate",
     "definition": "The percent r in A = P(1 − r)^t that is removed each period; r > 0 for decreasing quantities",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Half-life",
     "definition": "The amount of time required for a quantity to decrease to exactly half of its original amount",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Asymptote (exponential function)",
     "definition": "A horizontal line, y = 0 for y = a·b^x, that the graph approaches at one end but never reaches",
     "topic": "Exponential Growth & Decay"
    },
    {
     "term": "Euler's number (e)",
     "definition": "An irrational constant approximately 2.71828 that serves as the base of natural exponential and log functions",
     "topic": "Compound Interest & e"
    },
    {
     "term": "Compound interest formula",
     "definition": "A = P(1 + r/n)^(nt), giving account balance after t years with n compounding periods per year",
     "topic": "Compound Interest & e"
    },
    {
     "term": "Continuous compounding formula",
     "definition": "A = Pe^(rt), the balance when interest is added at every instant instead of in separate periods",
     "topic": "Compound Interest & e"
    },
    {
     "term": "Principal",
     "definition": "The initial amount of money invested or borrowed, represented by P, before any interest is applied",
     "topic": "Compound Interest & e"
    },
    {
     "term": "Annual interest rate",
     "definition": "The yearly percentage rate r, written as a decimal in interest formulas such as A = P(1 + r/n)^(nt)",
     "topic": "Compound Interest & e"
    },
    {
     "term": "Logarithm",
     "definition": "The exponent to which a fixed base must be raised to produce a given number",
     "topic": "Logarithm Basics"
    },
    {
     "term": "Common logarithm",
     "definition": "A logarithm with base 10, written log x, where the base is left unwritten",
     "topic": "Logarithm Basics"
    },
    {
     "term": "Natural logarithm",
     "definition": "A logarithm with base e, written ln x",
     "topic": "Logarithm Basics"
    },
    {
     "term": "Base (of a logarithm)",
     "definition": "The positive number b ≠ 1 in log_b x that is raised to a power to produce x",
     "topic": "Logarithm Basics"
    },
    {
     "term": "Argument (of a logarithm)",
     "definition": "The quantity whose logarithm is being taken, which must always be positive",
     "topic": "Logarithm Basics"
    },
    {
     "term": "Product property of logarithms",
     "definition": "log_b(MN) = log_b M + log_b N",
     "topic": "Log Properties"
    },
    {
     "term": "Quotient property of logarithms",
     "definition": "log_b(M/N) = log_b M − log_b N",
     "topic": "Log Properties"
    },
    {
     "term": "Power property of logarithms",
     "definition": "log_b(M^k) = k·log_b M",
     "topic": "Log Properties"
    },
    {
     "term": "Change of base formula",
     "definition": "log_b x = (log x)/(log b), used to evaluate a logarithm with any base on a calculator",
     "topic": "Log Properties"
    },
    {
     "term": "Exponential equation",
     "definition": "An equation in which the unknown variable appears somewhere in an exponent",
     "topic": "Solving Exponential Equations"
    },
    {
     "term": "Logarithmic equation",
     "definition": "An equation that contains the logarithm of an expression involving the unknown variable",
     "topic": "Solving Logarithmic Equations"
    },
    {
     "term": "Extraneous solution",
     "definition": "A value found algebraically that fails to satisfy the original equation, often from taking the log of a negative number",
     "topic": "Solving Logarithmic Equations"
    },
    {
     "term": "Inverse functions",
     "definition": "Two functions that undo one another, so f(g(x)) = x; their graphs are reflections across the line y = x",
     "topic": "Inverse Relationship (Exp & Log)"
    },
    {
     "term": "Domain of a logarithmic function",
     "definition": "The set of all x greater than 0, since a logarithm is undefined for zero or negative inputs",
     "topic": "Inverse Relationship (Exp & Log)"
    }
   ],
   "questions": [
    {
     "id": "alg2-u6-q1",
     "type": "mc",
     "prompt": "A bacteria population grows according to P(t) = 200·(1.15)^t, where t is in hours. What is the growth rate per hour?",
     "options": [
      "15%",
      "1.15%",
      "115%",
      "200%"
     ],
     "answer": "15%",
     "explanation": "Writing the model as P = a(1 + r)^t, the base is 1 + r = 1.15, so r = 0.15 = 15%.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q2",
     "type": "mc",
     "prompt": "A car worth $24,000 loses 12% of its value every year. Which function models its value V after t years?",
     "options": [
      "V(t) = 24000(0.88)^t",
      "V(t) = 24000(1.12)^t",
      "V(t) = 24000(0.12)^t",
      "V(t) = 24000(1.88)^t"
     ],
     "answer": "V(t) = 24000(0.88)^t",
     "explanation": "Losing 12% each year means 88% remains, so the decay factor is 1 − 0.12 = 0.88.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q3",
     "type": "mc",
     "prompt": "A radioactive sample has a half-life of 8 days. Starting with 160 grams, how many grams remain after 24 days?",
     "options": [
      "20 g",
      "40 g",
      "10 g",
      "80 g"
     ],
     "answer": "20 g",
     "explanation": "24 days ÷ 8 days = 3 half-lives: 160 → 80 → 40 → 20 grams.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u6-q4",
     "type": "mc",
     "prompt": "In the compound interest formula A = P(1 + r/n)^(nt), which variable represents the number of compounding periods per year?",
     "options": [
      "n",
      "r",
      "t",
      "P"
     ],
     "answer": "n",
     "explanation": "n is the number of times per year interest is compounded; r is the rate, t is time in years, and P is the principal.",
     "topic": "Compound Interest & e",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q5",
     "type": "mc",
     "prompt": "$1000 is invested at 6% annual interest compounded quarterly. What is the balance after 2 years, to the nearest dollar?",
     "options": [
      "$1126",
      "$1120",
      "$1060",
      "$1200"
     ],
     "answer": "$1126",
     "explanation": "A = 1000(1 + 0.06/4)^(4·2) = 1000(1.015)^8 ≈ 1000(1.126492) = $1126.49, which rounds to $1126.",
     "topic": "Compound Interest & e",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u6-q6",
     "type": "mc",
     "prompt": "Which expression gives the balance after t years for $500 invested at 4% annual interest compounded continuously?",
     "options": [
      "500e^(0.04t)",
      "500e^(4t)",
      "500(1.04)^t",
      "500(0.04)^t"
     ],
     "answer": "500e^(0.04t)",
     "explanation": "Continuous compounding uses A = Pe^(rt) with P = 500 and r = 0.04, giving 500e^(0.04t).",
     "topic": "Compound Interest & e",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q7",
     "type": "mc",
     "prompt": "Which exponential equation is equivalent to log₃ 81 = 4?",
     "options": [
      "3^4 = 81",
      "4^3 = 81",
      "81^4 = 3",
      "81^3 = 4"
     ],
     "answer": "3^4 = 81",
     "explanation": "log_b x = y means b^y = x, so log₃ 81 = 4 means 3^4 = 81.",
     "topic": "Logarithm Basics",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q8",
     "type": "mc",
     "prompt": "What is the value of log₅ 125?",
     "options": [
      "3",
      "5",
      "25",
      "15"
     ],
     "answer": "3",
     "explanation": "Since 5³ = 125, the exponent needed is 3, so log₅ 125 = 3.",
     "topic": "Logarithm Basics",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q9",
     "type": "mc",
     "prompt": "What is the value of ln(e^7)?",
     "options": [
      "7",
      "e^7",
      "1",
      "7e"
     ],
     "answer": "7",
     "explanation": "Since ln and e^x are inverse operations, ln(e^7) simply returns the exponent, 7.",
     "topic": "Logarithm Basics",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q10",
     "type": "mc",
     "prompt": "According to the product property of logarithms, log_b(MN) is equivalent to:",
     "options": [
      "log_b M + log_b N",
      "log_b M − log_b N",
      "log_b(M) · log_b(N)",
      "log_b M ÷ log_b N"
     ],
     "answer": "log_b M + log_b N",
     "explanation": "The product property states that the log of a product equals the sum of the logs: log_b(MN) = log_b M + log_b N.",
     "topic": "Log Properties",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q11",
     "type": "mc",
     "prompt": "Given log 2 ≈ 0.301 and log 3 ≈ 0.477, what is log 6?",
     "options": [
      "0.778",
      "0.176",
      "1.431",
      "0.301"
     ],
     "answer": "0.778",
     "explanation": "log 6 = log(2·3) = log 2 + log 3 = 0.301 + 0.477 = 0.778.",
     "topic": "Log Properties",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q12",
     "type": "mc",
     "prompt": "Using the power property of logarithms, log₂(x⁵) is equivalent to:",
     "options": [
      "5 log₂ x",
      "log₂(5x)",
      "(log₂ x)^5",
      "x log₂ 5"
     ],
     "answer": "5 log₂ x",
     "explanation": "The power property moves the exponent out front as a multiplier: log_b(M^k) = k·log_b M, so log₂(x⁵) = 5 log₂ x.",
     "topic": "Log Properties",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q13",
     "type": "mc",
     "prompt": "Which expression correctly uses the change of base formula to evaluate log₇ 50 on a calculator?",
     "options": [
      "(log 50)/(log 7)",
      "(log 7)/(log 50)",
      "log 50 − log 7",
      "log(50/7)"
     ],
     "answer": "(log 50)/(log 7)",
     "explanation": "The change of base formula is log_b x = (log x)/(log b), so log₇ 50 = (log 50)/(log 7).",
     "topic": "Log Properties",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u6-q14",
     "type": "mc",
     "prompt": "Which expression gives the solution to 5^x = 47?",
     "options": [
      "x = log 47/log 5",
      "x = log 5/log 47",
      "x = 47/5",
      "x = 5 log 47"
     ],
     "answer": "x = log 47/log 5",
     "explanation": "Taking log of both sides: log(5^x) = log 47, so x·log 5 = log 47, giving x = log 47/log 5.",
     "topic": "Solving Exponential Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q15",
     "type": "mc",
     "prompt": "How are the functions f(x) = b^x and g(x) = log_b x related?",
     "options": [
      "They are inverse functions",
      "They are identical functions",
      "Their graphs are perpendicular lines",
      "They are complementary functions"
     ],
     "answer": "They are inverse functions",
     "explanation": "An exponential function and the logarithmic function with the same base undo each other, so they are inverses of each other.",
     "topic": "Inverse Relationship (Exp & Log)",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q16",
     "type": "mc",
     "prompt": "If f(x) = 2^x, what is f⁻¹(x)?",
     "options": [
      "log₂ x",
      "1/2^x",
      "x^(1/2)",
      "2^(1/x)"
     ],
     "answer": "log₂ x",
     "explanation": "To invert an exponential function, swap x and y and solve for y: x = 2^y means y = log₂ x.",
     "topic": "Inverse Relationship (Exp & Log)",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q17",
     "type": "tf",
     "prompt": "In the exponential model y = a·b^x with a > 0, if 0 < b < 1, the function represents decay.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "When a > 0, a base between 0 and 1 makes each output a fixed fraction of the one before as x increases, so the quantity shrinks. That is decay.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q18",
     "type": "tf",
     "prompt": "The graph of the basic exponential growth function y = a·b^x (b > 1, no vertical shift) has a horizontal asymptote at y = 1.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The horizontal asymptote of an unshifted exponential function is y = 0, not y = 1, since the function approaches but never reaches zero.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q19",
     "type": "tf",
     "prompt": "The number e is an irrational number approximately equal to 2.618.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "e is irrational, but it is approximately 2.718 (2.71828…), not 2.618.",
     "topic": "Compound Interest & e",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q20",
     "type": "tf",
     "prompt": "As the number of compounding periods n increases without bound, A = P(1 + r/n)^(nt) approaches A = Pe^(nt).",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The continuous compounding limit is A = Pe^(rt), with the rate r in the exponent, not n.",
     "topic": "Compound Interest & e",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q21",
     "type": "tf",
     "prompt": "log_b x is only defined for x > 0, no matter what valid base b is used.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A logarithm asks what power the base must be raised to in order to get x, and a positive base can never produce a zero or negative result.",
     "topic": "Logarithm Basics",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q22",
     "type": "tf",
     "prompt": "For all valid x and y, log(x/y) = log x / log y.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The quotient property states log(x/y) = log x − log y (subtraction, not division).",
     "topic": "Log Properties",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q23",
     "type": "tf",
     "prompt": "To solve 2^(3x) = 16, you can rewrite 16 as 2^4 and set the exponents equal: 3x = 4.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since 16 = 2^4, matching bases lets you set the exponents equal, giving 3x = 4.",
     "topic": "Solving Exponential Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q24",
     "type": "tf",
     "prompt": "When solving log(x) + log(x − 3) = 1, any solution that makes (x − 3) negative must be rejected as extraneous.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Logarithms are undefined for negative arguments, so a solution making x − 3 negative does not satisfy the original equation.",
     "topic": "Solving Logarithmic Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q25",
     "type": "written",
     "prompt": "A town's population grows by 5% each year. What growth factor (1 + r) is used in the exponential model for this town?",
     "answer": "1.05",
     "accept": [
      "105%"
     ],
     "explanation": "The growth rate is r = 0.05, so the growth factor is 1 + r = 1.05.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q26",
     "type": "written",
     "prompt": "A substance has a half-life of 6 years. Starting with 96 mg, how many mg remain after 24 years?",
     "answer": "6",
     "accept": [
      "6 mg",
      "6mg",
      "6 milligrams"
     ],
     "explanation": "24 ÷ 6 = 4 half-lives: 96 → 48 → 24 → 12 → 6 mg. Check: 96·(1/2)⁴ = 96/16 = 6.",
     "topic": "Exponential Growth & Decay",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q27",
     "type": "written",
     "prompt": "What is the value of e^0?",
     "answer": "1",
     "accept": [
      "1.0"
     ],
     "explanation": "Any nonzero base raised to the power 0 equals 1, so e^0 = 1.",
     "topic": "Compound Interest & e",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q28",
     "type": "written",
     "prompt": "$2000 is invested at 5% annual interest compounded continuously. Using A = Pe^(rt) and e ≈ 2.71828, what is the balance after 3 years, to the nearest dollar?",
     "answer": "2324",
     "accept": [
      "$2324",
      "2324 dollars",
      "$2,324"
     ],
     "explanation": "A = 2000·e^(0.05·3) = 2000·e^0.15 ≈ 2000(1.161834) = $2323.67, which rounds to $2324.",
     "topic": "Compound Interest & e",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u6-q29",
     "type": "written",
     "prompt": "Evaluate log 1000 (the common logarithm, base 10).",
     "answer": "3",
     "accept": [],
     "explanation": "Since 10³ = 1000, log 1000 = 3.",
     "topic": "Logarithm Basics",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q30",
     "type": "written",
     "prompt": "Evaluate ln 1 (the natural logarithm of 1).",
     "answer": "0",
     "accept": [],
     "explanation": "Since e^0 = 1, ln 1 = 0.",
     "topic": "Logarithm Basics",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u6-q31",
     "type": "written",
     "prompt": "Solve for x: 4^x = 64.",
     "answer": "x = 3",
     "accept": [
      "x=3",
      "3"
     ],
     "explanation": "64 = 4³, so matching bases gives x = 3.",
     "topic": "Solving Exponential Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u6-q32",
     "type": "written",
     "prompt": "Solve for x: log₂(x) + log₂(x − 2) = 3, rejecting any solution outside the domain.",
     "answer": "x = 4",
     "accept": [
      "x=4",
      "4"
     ],
     "explanation": "log₂[x(x−2)] = 3 gives x(x−2) = 8, so x² − 2x − 8 = 0, factoring to (x−4)(x+2) = 0; x = −2 is rejected since it makes the log arguments negative, leaving x = 4.",
     "topic": "Solving Logarithmic Equations",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg2-u7",
   "unit": 7,
   "title": "Rational Functions",
   "summary": "Explore direct, inverse, and joint variation, then simplify, multiply, divide, add, and subtract rational expressions. Learn to find vertical and horizontal asymptotes, holes, and domains, and solve rational equations while catching extraneous solutions.",
   "topics": [
    "Variation",
    "Simplifying Rational Expressions",
    "Multiplying and Dividing Rational Expressions",
    "Adding and Subtracting Rational Expressions",
    "Asymptotes and Holes",
    "Domain of Rational Functions",
    "Solving Rational Equations"
   ],
   "terms": [
    {
     "term": "Rational function",
     "definition": "A function written as one polynomial divided by another, defined everywhere the denominator is nonzero.",
     "topic": "Domain of Rational Functions"
    },
    {
     "term": "Rational expression",
     "definition": "A fraction whose numerator and denominator are both polynomials.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Direct variation",
     "definition": "A relationship y = kx with k ≠ 0, so the ratio y/x stays constant.",
     "topic": "Variation"
    },
    {
     "term": "Inverse variation",
     "definition": "A relationship y = k/x with k ≠ 0, so the product xy stays constant.",
     "topic": "Variation"
    },
    {
     "term": "Joint variation",
     "definition": "One variable equals a nonzero constant times the product of two or more others, as in y = kxz.",
     "topic": "Variation"
    },
    {
     "term": "Constant of variation",
     "definition": "The nonzero number k in y = kx, y = k/x or y = kxz that links the quantities.",
     "topic": "Variation"
    },
    {
     "term": "Vertical asymptote",
     "definition": "A vertical line x = a the graph approaches without bound, where the simplified denominator equals zero.",
     "topic": "Asymptotes and Holes"
    },
    {
     "term": "Horizontal asymptote",
     "definition": "A horizontal line a graph approaches as x goes toward positive or negative infinity.",
     "topic": "Asymptotes and Holes"
    },
    {
     "term": "Slant asymptote",
     "definition": "A diagonal line a graph approaches when the numerator's degree is exactly one greater than the denominator's.",
     "topic": "Asymptotes and Holes"
    },
    {
     "term": "Hole (removable discontinuity)",
     "definition": "A single missing point on a graph, caused by a factor that cancels from both the numerator and denominator.",
     "topic": "Asymptotes and Holes"
    },
    {
     "term": "Degree of a polynomial",
     "definition": "The value of the largest exponent on the variable, used to compare the growth of a numerator and denominator.",
     "topic": "Asymptotes and Holes"
    },
    {
     "term": "Excluded value",
     "definition": "An input that makes a denominator zero, so it cannot belong to the function's domain.",
     "topic": "Domain of Rational Functions"
    },
    {
     "term": "Domain of a rational function",
     "definition": "All real numbers except the inputs that make the denominator equal to zero.",
     "topic": "Domain of Rational Functions"
    },
    {
     "term": "Fundamental rule of rational expressions",
     "definition": "ac/(bc) = a/b for b, c ≠ 0; a shared factor may be divided out.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Common factor",
     "definition": "An expression that divides evenly into both the numerator and the denominator.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Complex fraction",
     "definition": "A fraction that contains at least one smaller fraction within its numerator or denominator.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Reciprocal",
     "definition": "The result of swapping a fraction's numerator and denominator, used to turn division into multiplication.",
     "topic": "Multiplying and Dividing Rational Expressions"
    },
    {
     "term": "Multiplying rational expressions rule",
     "definition": "(a/b) · (c/d) = (ac)/(bd), after factoring and canceling any shared factors.",
     "topic": "Multiplying and Dividing Rational Expressions"
    },
    {
     "term": "Dividing rational expressions rule",
     "definition": "(a/b) ÷ (c/d) = (a/b) · (d/c) — multiply by the reciprocal of the divisor.",
     "topic": "Multiplying and Dividing Rational Expressions"
    },
    {
     "term": "Least common denominator (LCD)",
     "definition": "The smallest expression that every denominator in a problem divides into evenly.",
     "topic": "Adding and Subtracting Rational Expressions"
    },
    {
     "term": "Unlike denominators",
     "definition": "Fraction bottoms that differ, so they must be rewritten to match before adding or subtracting.",
     "topic": "Adding and Subtracting Rational Expressions"
    },
    {
     "term": "Rational equation",
     "definition": "An equation containing at least one fraction with a variable in its denominator.",
     "topic": "Solving Rational Equations"
    },
    {
     "term": "Extraneous solution",
     "definition": "A value found while solving that fails in the original equation, usually because it makes a denominator zero.",
     "topic": "Solving Rational Equations"
    },
    {
     "term": "Cross multiplication",
     "definition": "Solving a proportion a/b = c/d by setting a·d equal to b·c.",
     "topic": "Solving Rational Equations"
    }
   ],
   "questions": [
    {
     "id": "alg2-u7-q1",
     "type": "mc",
     "prompt": "If y varies directly as x, and y = 15 when x = 3, what is the constant of variation k?",
     "options": [
      "5",
      "3",
      "45",
      "1/5"
     ],
     "answer": "5",
     "explanation": "Direct variation means y = kx, so 15 = k·3, giving k = 15/3 = 5. Check: 5·3 = 15. ✓",
     "topic": "Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q2",
     "type": "mc",
     "prompt": "If y varies inversely as x, and y = 4 when x = 9, find y when x = 6.",
     "options": [
      "6",
      "8/3",
      "36",
      "24"
     ],
     "answer": "6",
     "explanation": "Inverse variation means xy = k, so k = 9·4 = 36. Then y = 36/6 = 6. Check: 6·6 = 36. ✓",
     "topic": "Variation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q3",
     "type": "tf",
     "prompt": "In the joint variation z = kxy, if both x and y are doubled while k stays the same, then z is also exactly doubled.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Replacing x and y with 2x and 2y gives z = k(2x)(2y) = 4kxy, so z becomes 4 times as large, not 2 times as large.",
     "topic": "Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q4",
     "type": "written",
     "prompt": "The distance d a spring stretches varies directly with the force F applied. A force of 8 pounds stretches the spring 3 inches. How many inches will a force of 20 pounds stretch the spring?",
     "answer": "7.5",
     "accept": [
      "15/2",
      "7 1/2"
     ],
     "explanation": "d = kF, so k = 3/8. Then d = (3/8)(20) = 60/8 = 7.5 inches. Check: 7.5/20 = 3/8. ✓",
     "topic": "Variation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q5",
     "type": "mc",
     "prompt": "Simplify: (x² − 9)/(x + 3)",
     "options": [
      "x − 3",
      "x + 3",
      "3 − x",
      "x² − 3"
     ],
     "answer": "x − 3",
     "explanation": "Factor the numerator: x² − 9 = (x − 3)(x + 3). Canceling the common (x + 3) factor leaves x − 3.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q6",
     "type": "mc",
     "prompt": "Simplify: (2x² + 6x)/(4x)",
     "options": [
      "(x + 3)/2",
      "2x + 6",
      "(x + 3)/4",
      "2(x + 3)"
     ],
     "answer": "(x + 3)/2",
     "explanation": "Factor: 2x² + 6x = 2x(x + 3). Dividing by 4x gives 2x(x + 3)/(4x) = (x + 3)/2 after canceling 2x.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q7",
     "type": "tf",
     "prompt": "The expression (x + 5)/(x + 5) equals 1 for every real value of x.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "It equals 1 for all x except x = −5, where both numerator and denominator equal 0 and the expression is undefined, not 1.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q8",
     "type": "written",
     "prompt": "Simplify (x² − 16)/(x − 4), then evaluate the simplified expression at x = 10.",
     "answer": "14",
     "accept": [],
     "explanation": "x² − 16 = (x − 4)(x + 4), so the expression simplifies to x + 4. At x = 10: 10 + 4 = 14.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q9",
     "type": "mc",
     "prompt": "Multiply: (3/x) · (x²/6)",
     "options": [
      "x/2",
      "x²/2",
      "6/x",
      "x/6"
     ],
     "answer": "x/2",
     "explanation": "Multiply straight across: (3·x²)/(x·6) = 3x²/(6x). Cancel: 3/6 = 1/2 and x²/x = x, leaving x/2.",
     "topic": "Multiplying and Dividing Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q10",
     "type": "mc",
     "prompt": "Divide: [(x + 2)/5] ÷ [(x + 2)/10]",
     "options": [
      "2",
      "1/2",
      "(x + 2)²/50",
      "10"
     ],
     "answer": "2",
     "explanation": "Multiply by the reciprocal: (x + 2)/5 · 10/(x + 2) = 10/5 = 2 after the (x + 2) factors cancel.",
     "topic": "Multiplying and Dividing Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q11",
     "type": "tf",
     "prompt": "To divide two rational expressions, you multiply the first expression by the reciprocal of the second.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Dividing by a fraction is the same as multiplying by its reciprocal, so (a/b) ÷ (c/d) = (a/b) · (d/c).",
     "topic": "Multiplying and Dividing Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q12",
     "type": "written",
     "prompt": "Simplify [(x² − 4)/(x + 1)] · [(x + 1)/(x − 2)], then evaluate the simplified expression at x = 5.",
     "answer": "7",
     "accept": [],
     "explanation": "The (x + 1) factors cancel, and x² − 4 = (x − 2)(x + 2), so the expression simplifies to x + 2. At x = 5: 5 + 2 = 7.",
     "topic": "Multiplying and Dividing Rational Expressions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u7-q13",
     "type": "mc",
     "prompt": "Add: 3/x + 2/x",
     "options": [
      "5/x",
      "5/(2x)",
      "6/x²",
      "5/x²"
     ],
     "answer": "5/x",
     "explanation": "The denominators already match, so add the numerators: (3 + 2)/x = 5/x.",
     "topic": "Adding and Subtracting Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q14",
     "type": "mc",
     "prompt": "Subtract: 5/(x + 1) − 3/(x + 1)",
     "options": [
      "2/(x + 1)",
      "8/(x + 1)",
      "2/(2x + 1)",
      "2"
     ],
     "answer": "2/(x + 1)",
     "explanation": "The denominators match, so subtract the numerators: (5 − 3)/(x + 1) = 2/(x + 1).",
     "topic": "Adding and Subtracting Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q15",
     "type": "mc",
     "prompt": "What is the least common denominator (LCD) of 1/(x − 2) and 1/(x + 3)?",
     "options": [
      "(x − 2)(x + 3)",
      "(x − 2) + (x + 3)",
      "2(x − 2)(x + 3)",
      "(x − 2)²(x + 3)²"
     ],
     "answer": "(x − 2)(x + 3)",
     "explanation": "The two denominators share no common factor, so the LCD is simply their product, (x − 2)(x + 3). The other products are common denominators too, but they are not the least.",
     "topic": "Adding and Subtracting Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q16",
     "type": "tf",
     "prompt": "To add two rational expressions with different denominators, you must first rewrite them with a common denominator.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Just like numeric fractions, rational expressions need a shared denominator before their numerators can be combined.",
     "topic": "Adding and Subtracting Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q17",
     "type": "mc",
     "prompt": "Simplify: 4/x − 1/(2x)",
     "answer": "7/(2x)",
     "accept": [
      "7/2",
      "3.5"
     ],
     "explanation": "The LCD is 2x, so 4/x = 8/(2x). Then 8/(2x) − 1/(2x) = (8 − 1)/(2x) = 7/(2x). Check with x = 1: 4 − 0.5 = 3.5 = 7/2. ✓",
     "topic": "Adding and Subtracting Rational Expressions",
     "difficulty": "hard",
     "options": [
      "7/(2x)",
      "3/(2x)",
      "3/x",
      "7/x"
     ]
    },
    {
     "id": "alg2-u7-q18",
     "type": "mc",
     "prompt": "What is the vertical asymptote of f(x) = 1/(x − 4)?",
     "options": [
      "x = 4",
      "x = −4",
      "x = 0",
      "y = 4"
     ],
     "answer": "x = 4",
     "explanation": "A vertical asymptote occurs where the denominator equals 0. Setting x − 4 = 0 gives x = 4.",
     "topic": "Asymptotes and Holes",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q19",
     "type": "mc",
     "prompt": "Find the horizontal asymptote of f(x) = (3x² + 1)/(x² − 5).",
     "options": [
      "y = 3",
      "y = 0",
      "y = 3x",
      "x = 3"
     ],
     "answer": "y = 3",
     "explanation": "The numerator and denominator both have degree 2, so the horizontal asymptote is the ratio of leading coefficients: y = 3/1 = 3.",
     "topic": "Asymptotes and Holes",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q20",
     "type": "mc",
     "prompt": "Which function has a horizontal asymptote of y = 0?",
     "options": [
      "(x + 1)/(x² + 2)",
      "(x² + 1)/(x + 2)",
      "(2x + 3)/(x − 1)",
      "(x² + 3)/(x² − 4)"
     ],
     "answer": "(x + 1)/(x² + 2)",
     "explanation": "A horizontal asymptote of y = 0 occurs when the numerator's degree is less than the denominator's. Here degree 1 < degree 2, so y = 0.",
     "topic": "Asymptotes and Holes",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q21",
     "type": "tf",
     "prompt": "The graph of a rational function can never cross its horizontal asymptote.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A graph can cross a horizontal asymptote near the middle of the graph; the asymptote only describes the end behavior as x approaches ±∞.",
     "topic": "Asymptotes and Holes",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q22",
     "type": "tf",
     "prompt": "The function f(x) = (x² − 1)/(x − 1) has a hole at x = 1 instead of a vertical asymptote, because the factor (x − 1) cancels from both the numerator and denominator.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since x² − 1 = (x − 1)(x + 1), the (x − 1) factors cancel, leaving x + 1 with a single missing point (hole) at x = 1.",
     "topic": "Asymptotes and Holes",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q23",
     "type": "written",
     "prompt": "The function f(x) = (x − 3)/[(x − 3)(x + 2)] has a hole. At what x-value does the hole occur?",
     "answer": "3",
     "accept": [
      "x=3",
      "x = 3"
     ],
     "explanation": "The (x − 3) factor cancels from numerator and denominator, creating a hole exactly where that factor equals 0, at x = 3.",
     "topic": "Asymptotes and Holes",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u7-q24",
     "type": "mc",
     "prompt": "What is the domain of f(x) = 1/(x − 5)?",
     "options": [
      "All real numbers except x = 5",
      "All real numbers except x = −5",
      "All real numbers",
      "x > 5"
     ],
     "answer": "All real numbers except x = 5",
     "explanation": "The denominator x − 5 equals 0 when x = 5, so that value must be excluded from the domain.",
     "topic": "Domain of Rational Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q25",
     "type": "mc",
     "prompt": "What is the domain of f(x) = (x + 1)/(x² − 9)?",
     "options": [
      "All real numbers except x = 3 and x = −3",
      "All real numbers except x = 9",
      "All real numbers except x = −1",
      "All real numbers except x = 3"
     ],
     "answer": "All real numbers except x = 3 and x = −3",
     "explanation": "Set the denominator to 0: x² − 9 = 0 gives (x − 3)(x + 3) = 0, so x = 3 and x = −3 are excluded.",
     "topic": "Domain of Rational Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q26",
     "type": "tf",
     "prompt": "The domain of a rational function excludes any x-value that makes the numerator equal to zero.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The domain excludes values that make the denominator zero, not the numerator; a zero numerator just makes the function equal 0 at that point.",
     "topic": "Domain of Rational Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q27",
     "type": "written",
     "prompt": "For g(x) = (x + 4)/(x² − x − 6), list the x-values excluded from the domain, smallest first, separated by a comma.",
     "answer": "-2, 3",
     "accept": [
      "-2,3",
      "−2, 3",
      "−2,3",
      "-2 and 3",
      "−2 and 3",
      "-2 or 3",
      "−2 or 3",
      "x = -2, 3",
      "x = −2, 3",
      "x=-2,3",
      "x = -2, x = 3",
      "x=-2, x=3",
      "x=-2,x=3",
      "x = −2, x = 3",
      "x = -2 and x = 3",
      "x = −2 and x = 3",
      "x = -2 or x = 3",
      "x = −2 or x = 3"
     ],
     "explanation": "Factor the denominator: x² − x − 6 = (x − 3)(x + 2), which is 0 when x = 3 or x = −2. Check: (−2)² − (−2) − 6 = 4 + 2 − 6 = 0 and 3² − 3 − 6 = 0. Listed smallest first: −2, 3.",
     "topic": "Domain of Rational Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u7-q28",
     "type": "mc",
     "prompt": "Solve for x: 3/x = 6/10",
     "options": [
      "5",
      "20",
      "1/2",
      "2"
     ],
     "answer": "5",
     "explanation": "Cross multiply: 3·10 = 6·x, so 30 = 6x, giving x = 5. Check: 3/5 = 0.6 and 6/10 = 0.6. ✓",
     "topic": "Solving Rational Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u7-q29",
     "type": "mc",
     "prompt": "Solve for x: 2/(x − 1) = 4/(x + 1)",
     "options": [
      "3",
      "1",
      "−1",
      "6"
     ],
     "answer": "3",
     "explanation": "Cross multiply: 2(x + 1) = 4(x − 1), so 2x + 2 = 4x − 4, giving 6 = 2x, so x = 3. Check: 2/(3 − 1) = 1 and 4/(3 + 1) = 1. ✓",
     "topic": "Solving Rational Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q30",
     "type": "mc",
     "prompt": "Solve: x/(x − 3) = 3/(x − 3) + 2",
     "options": [
      "No solution (x = 3 is extraneous)",
      "x = 3 is the only solution",
      "x = 0 is the only solution",
      "x = 6 is the only solution"
     ],
     "answer": "No solution (x = 3 is extraneous)",
     "explanation": "Multiplying both sides by (x − 3) gives x = 3 + 2(x − 3) = 2x − 3, so x = 3. But x = 3 makes the original denominators zero, so it must be rejected, leaving no solution.",
     "topic": "Solving Rational Equations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u7-q31",
     "type": "tf",
     "prompt": "Extraneous solutions are values found while solving a rational equation that make one of the original denominators equal to zero, so they must be rejected.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Any algebraic solution that would make an original denominator 0 is not a true solution of the equation and must be discarded.",
     "topic": "Solving Rational Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q32",
     "type": "written",
     "prompt": "Solve for x: 5/x + 1 = 6",
     "answer": "1",
     "accept": [
      "x=1",
      "x = 1"
     ],
     "explanation": "Subtract 1 from both sides: 5/x = 5. Multiply both sides by x: 5 = 5x, so x = 1. Check: 5/1 + 1 = 6. ✓",
     "topic": "Solving Rational Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u7-q33",
     "type": "written",
     "prompt": "Solve for x: 1/(x − 2) + 1/(x + 2) = 4/(x² − 4)",
     "answer": "no solution",
     "accept": [
      "no solutions",
      "none",
      "no real solution",
      "no real solutions",
      "empty set",
      "the empty set",
      "DNE",
      "{}",
      "∅"
     ],
     "explanation": "Over the common denominator x² − 4, the left side is [(x + 2) + (x − 2)]/(x² − 4) = 2x/(x² − 4). Setting 2x = 4 gives x = 2, but x = 2 makes every denominator zero, so it is extraneous and there is no solution.",
     "topic": "Solving Rational Equations",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg2-u8",
   "unit": 8,
   "title": "Sequences and Series",
   "summary": "Explore patterns of numbers that grow by a constant amount (arithmetic) or a constant factor (geometric), writing them with explicit and recursive formulas. Learn to add up finite lists with sigma notation and series formulas, and discover when an infinite geometric sum actually settles on one finite value.",
   "topics": [
    "Arithmetic Sequences",
    "Geometric Sequences",
    "Sigma Notation",
    "Arithmetic Series",
    "Geometric Series",
    "Infinite Geometric Series"
   ],
   "terms": [
    {
     "term": "Sequence",
     "definition": "An ordered list of numbers that follows a specific pattern or rule.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Term",
     "definition": "A single number in a sequence, often labeled by its position, such as a₁ or a₅.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Arithmetic sequence",
     "definition": "A list of numbers where each value increases or decreases by the same constant amount.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Common difference (d)",
     "definition": "The constant amount added to each term to get the next one: d = a_n − a_(n−1).",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Explicit formula (arithmetic)",
     "definition": "a_n = a₁ + (n − 1)d, which gives any value directly from its position number n.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Recursive formula (arithmetic)",
     "definition": "a_n = a_(n−1) + d, which builds each value from the one immediately before it.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "General term",
     "definition": "An expression a_n describing the value at any position n in a sequence.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Geometric sequence",
     "definition": "A list of numbers where each value after the first equals the previous one times a fixed nonzero constant.",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Common ratio (r)",
     "definition": "The constant factor each term is multiplied by to get the next one: r = a_n ÷ a_(n−1).",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Explicit formula (geometric)",
     "definition": "a_n = a₁ · r^(n−1), which gives any value directly from its position number n.",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Recursive formula (geometric)",
     "definition": "a_n = a_(n−1) · r, which builds each value from the one immediately before it.",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Sigma notation",
     "definition": "A compact way to write a sum of terms using the symbol Σ along with a rule and limits.",
     "topic": "Sigma Notation"
    },
    {
     "term": "Index of summation",
     "definition": "The variable, often i, k, or n, that counts through the values being added in a sum.",
     "topic": "Sigma Notation"
    },
    {
     "term": "Limits of summation",
     "definition": "The starting and ending values written below and above Σ that mark which values to add.",
     "topic": "Sigma Notation"
    },
    {
     "term": "Partial sum",
     "definition": "The total of a fixed number of terms from the start of a list, often written S_n.",
     "topic": "Sigma Notation"
    },
    {
     "term": "Series",
     "definition": "The result of adding together the terms of a sequence.",
     "topic": "Arithmetic Series"
    },
    {
     "term": "Arithmetic series",
     "definition": "The sum obtained by adding the terms of an arithmetic sequence.",
     "topic": "Arithmetic Series"
    },
    {
     "term": "Arithmetic series sum formula",
     "definition": "S_n = n(a₁ + a_n)/2, using the count of terms along with the first and last values.",
     "topic": "Arithmetic Series"
    },
    {
     "term": "Geometric series",
     "definition": "The sum obtained by adding the terms of a geometric sequence.",
     "topic": "Geometric Series"
    },
    {
     "term": "Finite geometric series sum formula",
     "definition": "S_n = a₁(1 − rⁿ)/(1 − r), valid whenever the ratio is not equal to 1.",
     "topic": "Geometric Series"
    },
    {
     "term": "Infinite geometric series",
     "definition": "The sum formed by adding infinitely many terms of a geometric sequence.",
     "topic": "Infinite Geometric Series"
    },
    {
     "term": "Convergent series",
     "definition": "A series whose running totals settle toward one fixed, finite value as more terms are added.",
     "topic": "Infinite Geometric Series"
    },
    {
     "term": "Divergent series",
     "definition": "A series whose running totals grow without bound or never settle on one finite value.",
     "topic": "Infinite Geometric Series"
    },
    {
     "term": "Infinite geometric series sum formula",
     "definition": "S = a₁/(1 − r), which only applies when the ratio satisfies |r| < 1.",
     "topic": "Infinite Geometric Series"
    }
   ],
   "questions": [
    {
     "id": "alg2-u8-q1",
     "type": "mc",
     "prompt": "What is the common difference of the arithmetic sequence 5, 9, 13, 17, …?",
     "options": [
      "4",
      "5",
      "3",
      "9"
     ],
     "answer": "4",
     "explanation": "Subtract consecutive terms: 9 − 5 = 4, 13 − 9 = 4, 17 − 13 = 4. Each check gives 4, so d = 4.",
     "topic": "Arithmetic Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q2",
     "type": "mc",
     "prompt": "An arithmetic sequence has first term a₁ = 7 and common difference d = −3. Which is its explicit formula?",
     "options": [
      "a_n = 7 − 3(n−1)",
      "a_n = 7 + 3(n−1)",
      "a_n = −3 + 7(n−1)",
      "a_n = 7 − 3n"
     ],
     "answer": "a_n = 7 − 3(n−1)",
     "explanation": "The explicit form is a_n = a₁ + (n−1)d = 7 + (n−1)(−3) = 7 − 3(n−1). Check: n=1 gives 7 − 0 = 7, matching a₁.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q3",
     "type": "mc",
     "prompt": "An arithmetic sequence starts at a₁ = 2 with common difference d = 5. What is the 10th term?",
     "options": [
      "47",
      "42",
      "52",
      "45"
     ],
     "answer": "47",
     "explanation": "a₁₀ = a₁ + 9d = 2 + 9(5) = 2 + 45 = 47. Double-check: 9 × 5 = 45, and 2 + 45 = 47.",
     "topic": "Arithmetic Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q4",
     "type": "mc",
     "prompt": "A theater's row 1 has 12 seats, and each following row has 3 more seats than the row before it. How many seats are in row 15?",
     "options": [
      "54",
      "57",
      "51",
      "45"
     ],
     "answer": "54",
     "explanation": "This is arithmetic with a₁ = 12, d = 3, n = 15: a₁₅ = 12 + (15−1)(3) = 12 + 42 = 54. Double-check: 14 × 3 = 42, and 12 + 42 = 54.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q5",
     "type": "tf",
     "prompt": "In an arithmetic sequence, the common difference d is found using d = a_(n−1) − a_n (the earlier term minus the later term).",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The common difference is the later term minus the earlier one, d = a_n − a_(n−1); reversing the subtraction flips the sign of d.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q6",
     "type": "tf",
     "prompt": "The sequence 2, 5, 8, 11, … is a geometric sequence.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The ratios 5/2 = 2.5 and 8/5 = 1.6 are not equal, so there is no common ratio; instead each term increases by 3, making it arithmetic, not geometric.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q7",
     "type": "written",
     "prompt": "An arithmetic sequence has a₁ = 4 and d = 6. Find a₂₀.",
     "answer": "118",
     "accept": [],
     "explanation": "a₂₀ = a₁ + 19d = 4 + 19(6) = 4 + 114 = 118. Double-check: 19 × 6 = 114, and 4 + 114 = 118.",
     "topic": "Arithmetic Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q8",
     "type": "mc",
     "prompt": "What is the common ratio of the geometric sequence 81, 27, 9, 3, …?",
     "options": [
      "1/3",
      "3",
      "−1/3",
      "1/9"
     ],
     "answer": "1/3",
     "explanation": "Divide any term by the one before it: 27 ÷ 81 = 1/3, and 9 ÷ 27 = 1/3, confirming r = 1/3.",
     "topic": "Geometric Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q9",
     "type": "mc",
     "prompt": "A geometric sequence has a₁ = 5 and common ratio r = 4. Which is its explicit formula?",
     "options": [
      "a_n = 5 · 4^(n−1)",
      "a_n = 4 · 5^(n−1)",
      "a_n = 5 + 4(n−1)",
      "a_n = 5 · 4^n"
     ],
     "answer": "a_n = 5 · 4^(n−1)",
     "explanation": "The explicit form is a_n = a₁ · r^(n−1) = 5 · 4^(n−1). Check: n=1 gives 5 · 4⁰ = 5 · 1 = 5, matching a₁.",
     "topic": "Geometric Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q10",
     "type": "mc",
     "prompt": "A bacteria culture starts with 200 cells and triples every hour. How many cells are present after 5 hours?",
     "options": [
      "48,600",
      "16,200",
      "145,800",
      "24,300"
     ],
     "answer": "48,600",
     "explanation": "Cells = 200 · 3⁵. Since 3⁵ = 243, cells = 200 × 243 = 48,600. Double-check: 200 × 243 = 200×240 + 200×3 = 48,000 + 600 = 48,600.",
     "topic": "Geometric Sequences",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u8-q11",
     "type": "tf",
     "prompt": "The sequence 3, 6, 12, 24, … is geometric with common ratio 2.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Each term is double the one before it: 6/3 = 2, 12/6 = 2, 24/12 = 2, so the common ratio is indeed 2.",
     "topic": "Geometric Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q12",
     "type": "tf",
     "prompt": "In a geometric sequence, each term is found by multiplying the previous term by a fixed ratio r.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the definition of a geometric sequence: a_n = a_(n−1) · r for a constant r.",
     "topic": "Geometric Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q13",
     "type": "written",
     "prompt": "A geometric sequence has a₁ = 3 and r = 2. Find a₆.",
     "answer": "96",
     "accept": [],
     "explanation": "a₆ = a₁ · r⁵ = 3 · 2⁵ = 3 × 32 = 96. Double-check: 2⁵ = 32, and 3 × 32 = 96.",
     "topic": "Geometric Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q14",
     "type": "mc",
     "prompt": "Evaluate the sum Σ (i = 1 to 4) of 2i.",
     "options": [
      "20",
      "10",
      "24",
      "14"
     ],
     "answer": "20",
     "explanation": "Expand the terms: 2(1) + 2(2) + 2(3) + 2(4) = 2 + 4 + 6 + 8 = 20. Double-check: 2+4=6, 6+6=12, 12+8=20.",
     "topic": "Sigma Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q15",
     "type": "mc",
     "prompt": "Which sigma notation expression represents the sum 3 + 6 + 9 + 12 + 15?",
     "options": [
      "Σ (i = 1 to 5) of 3i",
      "Σ (i = 1 to 5) of (i + 3)",
      "Σ (i = 1 to 15) of 3i",
      "Σ (i = 0 to 4) of 3i"
     ],
     "answer": "Σ (i = 1 to 5) of 3i",
     "explanation": "Plugging i = 1,2,3,4,5 into 3i gives 3, 6, 9, 12, 15, exactly matching the terms of the given sum.",
     "topic": "Sigma Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q16",
     "type": "mc",
     "prompt": "How many terms are added in the sum Σ (k = 3 to 7) of k²?",
     "options": [
      "5",
      "4",
      "7",
      "3"
     ],
     "answer": "5",
     "explanation": "The index k runs through 3, 4, 5, 6, 7, which is 7 − 3 + 1 = 5 values, so 5 terms are added.",
     "topic": "Sigma Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q17",
     "type": "tf",
     "prompt": "The variable that counts through the terms in sigma notation (such as i, k, or n) is called the index of summation.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the standard name for the counting variable in a sigma-notation sum.",
     "topic": "Sigma Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q18",
     "type": "written",
     "prompt": "Evaluate Σ (n = 1 to 3) of n².",
     "answer": "14",
     "accept": [],
     "explanation": "Expand: 1² + 2² + 3² = 1 + 4 + 9 = 14. Double-check: 1+4=5, 5+9=14.",
     "topic": "Sigma Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q19",
     "type": "mc",
     "prompt": "Find the sum of the first 10 terms of the arithmetic sequence with a₁ = 3 and d = 5.",
     "options": [
      "255",
      "240",
      "270",
      "225"
     ],
     "answer": "255",
     "explanation": "First find a₁₀ = 3 + 9(5) = 48. Then S₁₀ = 10(a₁ + a₁₀)/2 = 10(3 + 48)/2 = 10(51)/2 = 255. Double-check: 3+48=51, 10×51=510, 510÷2=255.",
     "topic": "Arithmetic Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q20",
     "type": "mc",
     "prompt": "You save $10 the first week and increase your savings by $5 each week after that. What is the total saved after 8 weeks?",
     "options": [
      "$220",
      "$200",
      "$240",
      "$180"
     ],
     "answer": "$220",
     "explanation": "This is arithmetic with a₁ = 10, d = 5, n = 8. a₈ = 10 + 7(5) = 45, so S₈ = 8(10 + 45)/2 = 8(55)/2 = 220. Double-check: 10+45=55, 8×55=440, 440÷2=220.",
     "topic": "Arithmetic Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q21",
     "type": "tf",
     "prompt": "The sum of a finite arithmetic series can be found with S_n = n(a₁ + a_n)/2.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the standard formula, which averages the first and last term and multiplies by the number of terms.",
     "topic": "Arithmetic Series",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q22",
     "type": "tf",
     "prompt": "To find the sum of a finite arithmetic series, you must know its common ratio.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Arithmetic series use a common difference, not a common ratio; the sum formula S_n = n(a₁+a_n)/2 depends on d through a_n, not on any ratio.",
     "topic": "Arithmetic Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q23",
     "type": "written",
     "prompt": "Find the sum of the first 20 positive integers (1 + 2 + 3 + … + 20).",
     "answer": "210",
     "accept": [],
     "explanation": "Use S_n = n(a₁+a_n)/2 with a₁=1, a₂₀=20, n=20: S = 20(1+20)/2 = 20(21)/2 = 210. Double-check: 20×21=420, 420÷2=210.",
     "topic": "Arithmetic Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q24",
     "type": "mc",
     "prompt": "Find the sum of the first 5 terms of the geometric sequence with a₁ = 2 and r = 3.",
     "options": [
      "242",
      "240",
      "244",
      "121"
     ],
     "answer": "242",
     "explanation": "S₅ = a₁(1−r⁵)/(1−r) = 2(1−243)/(1−3) = 2(−242)/(−2) = 242. Double-check: 3⁵=243, 1−243=−242, 1−3=−2, so 2×(−242)/(−2)=2×121=242.",
     "topic": "Geometric Series",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u8-q25",
     "type": "mc",
     "prompt": "A ball's first bounce reaches 16 ft, and each next bounce reaches half the height of the one before. What is the total height covered by the first 4 bounces?",
     "options": [
      "30 ft",
      "32 ft",
      "28 ft",
      "15 ft"
     ],
     "answer": "30 ft",
     "explanation": "This is geometric with a₁=16, r=1/2, n=4: S₄ = 16(1−(1/2)⁴)/(1−1/2) = 16(1−1/16)/(1/2) = 16(15/16)×2 = 30. Double-check: 15/16×16=15, 15×2=30.",
     "topic": "Geometric Series",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u8-q26",
     "type": "tf",
     "prompt": "The finite geometric series formula S_n = a₁(1−rⁿ)/(1−r) still works when r = 1.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "When r = 1 the denominator (1−r) becomes 0, which is undefined; instead, when r=1 every term equals a₁, so S_n = n·a₁.",
     "topic": "Geometric Series",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u8-q27",
     "type": "written",
     "prompt": "A geometric sequence has a₁ = 5 and r = 2. Find the sum of its first 4 terms.",
     "answer": "75",
     "accept": [],
     "explanation": "S₄ = a₁(1−r⁴)/(1−r) = 5(1−16)/(1−2) = 5(−15)/(−1) = 75. Double-check by adding terms directly: 5+10+20+40 = 75.",
     "topic": "Geometric Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q28",
     "type": "mc",
     "prompt": "An infinite geometric series converges (has a finite sum) only when:",
     "options": [
      "|r| < 1",
      "|r| > 1",
      "r = 1",
      "r can be any real number"
     ],
     "answer": "|r| < 1",
     "explanation": "When the ratio's absolute value is less than 1, each term shrinks toward 0, so the partial sums approach a fixed finite value.",
     "topic": "Infinite Geometric Series",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q29",
     "type": "mc",
     "prompt": "Find the sum of the infinite geometric series with a₁ = 8 and r = 1/4.",
     "options": [
      "32/3",
      "8/3",
      "2",
      "6"
     ],
     "answer": "32/3",
     "explanation": "S = a₁/(1−r) = 8/(1−1/4) = 8/(3/4) = 32/3. Double-check: 8 ÷ 0.75 = 10.667, and 32/3 = 10.667.",
     "topic": "Infinite Geometric Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q30",
     "type": "mc",
     "prompt": "Which infinite geometric series converges to a finite sum?",
     "options": [
      "a₁ = 10, r = −0.5",
      "a₁ = 5, r = 1.5",
      "a₁ = 3, r = 2",
      "a₁ = 1, r = −3"
     ],
     "answer": "a₁ = 10, r = −0.5",
     "explanation": "Only the series with |r| < 1 converges. Here |−0.5| = 0.5 < 1, while the other ratios (1.5, 2, and −3) all have absolute value greater than 1.",
     "topic": "Infinite Geometric Series",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u8-q31",
     "type": "tf",
     "prompt": "An infinite geometric series with r = −0.5 converges to a finite sum.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since |−0.5| = 0.5 < 1, the series converges; its sum would be S = a₁/(1−(−0.5)) = a₁/1.5.",
     "topic": "Infinite Geometric Series",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q32",
     "type": "tf",
     "prompt": "An infinite geometric series with r = 2 has a finite sum.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Since |2| = 2 is not less than 1, the terms grow without bound, so the series diverges and has no finite sum.",
     "topic": "Infinite Geometric Series",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u8-q33",
     "type": "written",
     "prompt": "Find the sum of the infinite geometric series with a₁ = 6 and r = 1/3.",
     "answer": "9",
     "accept": [],
     "explanation": "S = a₁/(1−r) = 6/(1−1/3) = 6/(2/3) = 9. Double-check: 6 ÷ (2/3) = 6 × 3/2 = 9.",
     "topic": "Infinite Geometric Series",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg2-u9",
   "unit": 9,
   "title": "Probability and Statistics",
   "summary": "Learn how to count outcomes with the counting principle, factorials, permutations, and combinations, then calculate and combine probabilities for independent, dependent, mutually exclusive, and conditional events using two-way tables. Explore the normal distribution, standard deviation, and z-scores, and learn how sampling methods, bias, and study design affect the reliability of statistical conclusions.",
   "topics": [
    "Counting Principles",
    "Permutations and Combinations",
    "Probability Rules",
    "Conditional Probability and Two-Way Tables",
    "Normal Distribution and Standard Deviation",
    "Sampling and Study Design"
   ],
   "terms": [
    {
     "term": "Fundamental Counting Principle",
     "definition": "If one event can occur in m ways and a second in n ways, both can occur together in m · n ways.",
     "topic": "Counting Principles"
    },
    {
     "term": "Factorial",
     "definition": "The product of a positive integer and every positive integer less than it, written n!.",
     "topic": "Counting Principles"
    },
    {
     "term": "Permutation",
     "definition": "An arrangement of a group of items in which the order they are placed in matters.",
     "topic": "Permutations and Combinations"
    },
    {
     "term": "Combination",
     "definition": "A selection of items from a group in which the order they are chosen in does not matter.",
     "topic": "Permutations and Combinations"
    },
    {
     "term": "Permutation formula",
     "definition": "nPr = n!/(n − r)!, giving the number of ordered arrangements of r items chosen from n.",
     "topic": "Permutations and Combinations"
    },
    {
     "term": "Combination formula",
     "definition": "nCr = n!/(r!(n − r)!), giving the number of unordered selections of r items chosen from n.",
     "topic": "Permutations and Combinations"
    },
    {
     "term": "Theoretical probability",
     "definition": "The ratio of favorable outcomes to total possible outcomes, found through reasoning rather than trials.",
     "topic": "Probability Rules"
    },
    {
     "term": "Experimental probability",
     "definition": "The ratio of the number of times an event actually occurs to the total number of trials performed.",
     "topic": "Probability Rules"
    },
    {
     "term": "Independent events",
     "definition": "Two events where the outcome of one has no effect on the probability of the other.",
     "topic": "Probability Rules"
    },
    {
     "term": "Dependent events",
     "definition": "Two events where the outcome of one changes the probability of the other occurring.",
     "topic": "Probability Rules"
    },
    {
     "term": "Mutually exclusive events",
     "definition": "Two events that cannot both happen during the same trial.",
     "topic": "Probability Rules"
    },
    {
     "term": "Addition rule",
     "definition": "P(A or B) = P(A) + P(B) − P(A and B), used to find the probability that either of two events occurs.",
     "topic": "Probability Rules"
    },
    {
     "term": "Complement of an event",
     "definition": "All outcomes in the sample space not included in a given event; its probability equals 1 minus the event's probability.",
     "topic": "Probability Rules"
    },
    {
     "term": "Conditional probability",
     "definition": "The probability that one event occurs given that another event is already known to have happened.",
     "topic": "Conditional Probability and Two-Way Tables"
    },
    {
     "term": "Conditional probability formula",
     "definition": "P(A | B) = P(A and B)/P(B), used to find the probability of A given that B has occurred.",
     "topic": "Conditional Probability and Two-Way Tables"
    },
    {
     "term": "Two-way table",
     "definition": "A table that organizes frequency counts for two categorical variables at the same time.",
     "topic": "Conditional Probability and Two-Way Tables"
    },
    {
     "term": "Standard deviation",
     "definition": "A measure of how far, on average, data values are spread from the mean.",
     "topic": "Normal Distribution and Standard Deviation"
    },
    {
     "term": "Normal distribution",
     "definition": "A symmetric, bell-shaped, single-peaked pattern of data centered at the mean.",
     "topic": "Normal Distribution and Standard Deviation"
    },
    {
     "term": "Empirical rule (68-95-99.7 rule)",
     "definition": "In a normal distribution, about 68%, 95%, and 99.7% of data fall within 1, 2, and 3 standard deviations of the mean.",
     "topic": "Normal Distribution and Standard Deviation"
    },
    {
     "term": "Z-score",
     "definition": "The number of standard deviations a value lies above or below the mean: z = (x − μ)/σ.",
     "topic": "Normal Distribution and Standard Deviation"
    },
    {
     "term": "Mean",
     "definition": "The sum of all data values divided by the number of values; the arithmetic average.",
     "topic": "Normal Distribution and Standard Deviation"
    },
    {
     "term": "Random sampling",
     "definition": "A method of choosing a sample so that every member of the population has an equal chance of being selected.",
     "topic": "Sampling and Study Design"
    },
    {
     "term": "Sampling bias",
     "definition": "A systematic tendency for a sample to be unrepresentative of the population it was drawn from.",
     "topic": "Sampling and Study Design"
    },
    {
     "term": "Observational study",
     "definition": "A study in which researchers measure or record variables without imposing any treatment on the subjects.",
     "topic": "Sampling and Study Design"
    },
    {
     "term": "Experiment (statistical)",
     "definition": "A study in which researchers deliberately impose a treatment on subjects to observe its effect on a response.",
     "topic": "Sampling and Study Design"
    },
    {
     "term": "Sample",
     "definition": "A subset of a population selected to represent and draw conclusions about the whole group.",
     "topic": "Sampling and Study Design"
    }
   ],
   "questions": [
    {
     "id": "alg2-u9-q1",
     "type": "mc",
     "prompt": "A restaurant offers 4 appetizers, 6 entrées, and 3 desserts. Using the fundamental counting principle, how many different three-course meals (one of each) are possible?",
     "options": [
      "72",
      "13",
      "24",
      "18"
     ],
     "answer": "72",
     "explanation": "Multiply the choices at each stage: 4 · 6 · 3 = 72 possible meals.",
     "topic": "Counting Principles",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q2",
     "type": "written",
     "prompt": "Evaluate 5! (5 factorial).",
     "answer": "120",
     "accept": [],
     "explanation": "5! = 5 · 4 · 3 · 2 · 1 = 120.",
     "topic": "Counting Principles",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q3",
     "type": "mc",
     "prompt": "A license plate has 2 letters followed by 4 digits, and both letters and digits may repeat. How many different license plates are possible?",
     "options": [
      "6,760,000",
      "676,000",
      "67,600,000",
      "6,760"
     ],
     "answer": "6,760,000",
     "explanation": "There are 26 choices for each letter and 10 for each digit: 26 · 26 · 10 · 10 · 10 · 10 = 676 · 10,000 = 6,760,000.",
     "topic": "Counting Principles",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q4",
     "type": "mc",
     "prompt": "In a race with 5 runners, in how many ways can 1st, 2nd, and 3rd place be awarded (order matters)?",
     "options": [
      "60",
      "125",
      "10",
      "20"
     ],
     "answer": "60",
     "explanation": "This is a permutation: ₅P₃ = 5!/(5−3)! = 5 · 4 · 3 = 60.",
     "topic": "Permutations and Combinations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q5",
     "type": "written",
     "prompt": "Evaluate 6C2, the number of ways to choose 2 items from a group of 6 when order does not matter.",
     "answer": "15",
     "accept": [],
     "explanation": "6C2 = 6!/(2!·4!) = (6 · 5)/(2 · 1) = 15.",
     "topic": "Permutations and Combinations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q6",
     "type": "mc",
     "prompt": "A pizza shop offers 8 toppings. How many different 3-topping pizzas can be made if no topping repeats and the order of toppings doesn't matter?",
     "options": [
      "56",
      "336",
      "24",
      "512"
     ],
     "answer": "56",
     "explanation": "This is a combination: 8C3 = 8!/(3!·5!) = (8 · 7 · 6)/(3 · 2 · 1) = 336/6 = 56.",
     "topic": "Permutations and Combinations",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u9-q7",
     "type": "tf",
     "prompt": "Choosing a committee of 3 people from a group of 10 is a combination problem, because the order the people are chosen in does not matter.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since the committee is the same group regardless of the order people were picked, order doesn't matter, making it a combination.",
     "topic": "Permutations and Combinations",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q8",
     "type": "tf",
     "prompt": "Arranging 4 different books in a row on a shelf is a combination problem, since the order of the books doesn't matter.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Different orderings of the same 4 books create different arrangements, so order matters and this is a permutation, not a combination.",
     "topic": "Permutations and Combinations",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q9",
     "type": "mc",
     "prompt": "A bag contains 5 red marbles and 3 blue marbles. What is the theoretical probability of randomly drawing a red marble?",
     "options": [
      "5/8",
      "3/8",
      "5/3",
      "1/2"
     ],
     "answer": "5/8",
     "explanation": "Theoretical probability is favorable outcomes over total outcomes: 5 red out of 5 + 3 = 8 total, so P(red) = 5/8.",
     "topic": "Probability Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q10",
     "type": "written",
     "prompt": "A coin is flipped 50 times and lands heads 28 times. What is the experimental probability of heads, written as a decimal rounded to two decimal places?",
     "answer": "0.56",
     "accept": [
      "28/50",
      "14/25",
      "56/100"
     ],
     "explanation": "Experimental probability uses actual results: 28 heads ÷ 50 flips = 0.56.",
     "topic": "Probability Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q11",
     "type": "mc",
     "prompt": "A jar has 4 green and 6 yellow candies. Two candies are drawn at random without replacement. What is the probability that both are green?",
     "options": [
      "2/15",
      "4/25",
      "1/5",
      "3/10"
     ],
     "answer": "2/15",
     "explanation": "These are dependent events: P = (4/10) · (3/9) = 12/90 = 2/15.",
     "topic": "Probability Rules",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u9-q12",
     "type": "tf",
     "prompt": "Rolling a standard die and flipping a coin at the same time are independent events.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The outcome of the die roll has no effect on the outcome of the coin flip, so the events are independent.",
     "topic": "Probability Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q13",
     "type": "mc",
     "prompt": "One card is drawn from a standard deck. Which pair of events is mutually exclusive?",
     "options": [
      "Drawing a red card and drawing a black card",
      "Drawing a king and drawing a heart",
      "Drawing a face card and drawing a heart",
      "Drawing an even-numbered card and drawing a red card"
     ],
     "answer": "Drawing a red card and drawing a black card",
     "explanation": "A card cannot be both red and black, so those events can never occur together; the other pairs overlap (e.g., the king of hearts is both a king and a heart).",
     "topic": "Probability Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q14",
     "type": "written",
     "prompt": "A spinner is equally likely to land on each number 1 through 8. Since landing on 3 and landing on 5 are mutually exclusive, what is P(3) + P(5) as a fraction in lowest terms?",
     "answer": "1/4",
     "accept": [
      "0.25",
      "2/8"
     ],
     "explanation": "Each outcome has probability 1/8, so by the addition rule P(3) + P(5) = 1/8 + 1/8 = 2/8 = 1/4.",
     "topic": "Probability Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q15",
     "type": "mc",
     "prompt": "In a class, P(plays a sport) = 0.5, P(plays an instrument) = 0.3, and P(does both) = 0.1. What is P(plays a sport or an instrument)?",
     "options": [
      "0.7",
      "0.8",
      "0.6",
      "0.9"
     ],
     "answer": "0.7",
     "explanation": "By the addition rule, P(A or B) = P(A) + P(B) − P(A and B) = 0.5 + 0.3 − 0.1 = 0.7.",
     "topic": "Probability Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q16",
     "type": "mc",
     "prompt": "On a standard six-sided die, the probability of rolling a number greater than 4 is 1/3. What is the probability of its complement, rolling a number that is 4 or less?",
     "options": [
      "2/3",
      "1/3",
      "1/2",
      "5/6"
     ],
     "answer": "2/3",
     "explanation": "The complement's probability is 1 minus the event's probability: 1 − 1/3 = 2/3.",
     "topic": "Probability Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q17",
     "type": "written",
     "prompt": "For two events, P(A) = 0.4 and P(A and B) = 0.12. Using the conditional probability formula, find P(B | A).",
     "answer": "0.3",
     "accept": [
      "3/10",
      "30%"
     ],
     "explanation": "P(B | A) = P(A and B)/P(A) = 0.12/0.4 = 0.3.",
     "topic": "Conditional Probability and Two-Way Tables",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u9-q18",
     "type": "mc",
     "prompt": "A survey of 60 students on pet ownership gave these results: Male students: 18 own a pet, 12 do not (30 total). Female students: 22 own a pet, 8 do not (30 total). Overall: 40 own a pet, 20 do not (60 total). What is the probability that a randomly selected student is female, given that the student owns a pet?",
     "options": [
      "11/20",
      "9/20",
      "22/60",
      "11/15"
     ],
     "answer": "11/20",
     "explanation": "Restrict to the 40 pet owners; 22 of them are female, so P(female | owns pet) = 22/40 = 11/20.",
     "topic": "Conditional Probability and Two-Way Tables",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q19",
     "type": "tf",
     "prompt": "If P(A | B) = P(A) for two events A and B, then A and B are independent events.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Independence means knowing B occurred doesn't change the probability of A, which is exactly the condition P(A | B) = P(A).",
     "topic": "Conditional Probability and Two-Way Tables",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q20",
     "type": "mc",
     "prompt": "Using the same survey of 60 students: Male students: 18 own a pet, 12 do not (30 total). Female students: 22 own a pet, 8 do not (30 total). Overall: 40 own a pet, 20 do not (60 total). What is the probability that a randomly selected student is male OR owns a pet?",
     "options": [
      "13/15",
      "4/5",
      "5/6",
      "7/10"
     ],
     "answer": "13/15",
     "explanation": "By the addition rule, P(male or pet) = P(male) + P(pet) − P(male and pet) = 30/60 + 40/60 − 18/60 = 52/60 = 13/15.",
     "topic": "Conditional Probability and Two-Way Tables",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u9-q21",
     "type": "mc",
     "prompt": "A data set is normally distributed with mean 100 and standard deviation 15. According to the 68-95-99.7 rule, about what percent of values fall between 85 and 115?",
     "options": [
      "68%",
      "95%",
      "99.7%",
      "50%"
     ],
     "answer": "68%",
     "explanation": "85 and 115 are each exactly 1 standard deviation from the mean (100 ± 15), and about 68% of data fall within 1 standard deviation.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q22",
     "type": "written",
     "prompt": "A normal distribution has mean 50 and standard deviation 8. What is the z-score for a data value of 66?",
     "answer": "2",
     "accept": [
      "z=2",
      "z = 2"
     ],
     "explanation": "z = (x − μ)/σ = (66 − 50)/8 = 16/8 = 2.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q23",
     "type": "mc",
     "prompt": "Test scores are normally distributed with mean 72 and standard deviation 6. About what percent of scores fall between 60 and 84?",
     "options": [
      "95%",
      "68%",
      "99.7%",
      "47.5%"
     ],
     "answer": "95%",
     "explanation": "60 and 84 are each 2 standard deviations from the mean (72 ± 12), and about 95% of data fall within 2 standard deviations.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q24",
     "type": "tf",
     "prompt": "In a normal distribution, the mean, median, and mode are all equal.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A normal distribution is perfectly symmetric and unimodal, so its center point serves as the mean, median, and mode simultaneously.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q25",
     "type": "mc",
     "prompt": "Two data sets have the same mean. Set A has a standard deviation of 2, and Set B has a standard deviation of 10. Which statement is true?",
     "options": [
      "Set B's values are more spread out from the mean than Set A's",
      "Set A's values are more spread out from the mean than Set B's",
      "Both sets have identical spread",
      "Set B's mean is higher than Set A's mean"
     ],
     "answer": "Set B's values are more spread out from the mean than Set A's",
     "explanation": "A larger standard deviation means data values are, on average, farther from the mean, so Set B is more spread out.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q26",
     "type": "written",
     "prompt": "A normally distributed data set has mean 40 and standard deviation 5. Using the 68-95-99.7 rule, what is the lower value marking the boundary of the range that contains 99.7% of the data (3 standard deviations below the mean)?",
     "answer": "25",
     "accept": [],
     "explanation": "3 standard deviations below the mean is 40 − 3(5) = 40 − 15 = 25.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u9-q27",
     "type": "tf",
     "prompt": "A data value with a z-score of −1.5 lies 1.5 standard deviations above the mean.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A negative z-score means the value is below the mean, so a z-score of −1.5 is 1.5 standard deviations below the mean, not above it.",
     "topic": "Normal Distribution and Standard Deviation",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q28",
     "type": "mc",
     "prompt": "A researcher assigns every student in a school a number, then uses a computer to randomly select 50 numbers for a survey. What sampling method is this?",
     "options": [
      "Simple random sampling",
      "Convenience sampling",
      "Stratified sampling",
      "Voluntary response sampling"
     ],
     "answer": "Simple random sampling",
     "explanation": "Every student has an equal chance of being chosen through the random computer selection, which is the definition of simple random sampling.",
     "topic": "Sampling and Study Design",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u9-q29",
     "type": "tf",
     "prompt": "Posting an online poll and collecting responses only from people who choose to click and answer is an example of simple random sampling.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is voluntary response sampling, which tends to overrepresent people with strong opinions rather than giving every member of the population an equal chance.",
     "topic": "Sampling and Study Design",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q30",
     "type": "mc",
     "prompt": "A researcher divides a population into age groups, then randomly selects a proportional number of people from each group. What sampling method is this?",
     "options": [
      "Stratified sampling",
      "Cluster sampling",
      "Systematic sampling",
      "Convenience sampling"
     ],
     "answer": "Stratified sampling",
     "explanation": "Dividing the population into subgroups (strata) and sampling from each one is the defining feature of stratified sampling.",
     "topic": "Sampling and Study Design",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q31",
     "type": "written",
     "prompt": "What statistical term describes a systematic error that causes a sample to not accurately represent the population it was drawn from?",
     "answer": "Sampling bias",
     "accept": [
      "bias",
      "selection bias",
      "sample bias"
     ],
     "explanation": "This systematic, non-random error in how a sample is selected is called sampling bias.",
     "topic": "Sampling and Study Design",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q32",
     "type": "mc",
     "prompt": "Which scenario describes a statistical experiment rather than an observational study?",
     "options": [
      "Researchers randomly assign patients to receive either a new drug or a placebo and compare outcomes",
      "Researchers record the eating habits of people who already follow different diets",
      "Researchers survey students about their study habits",
      "Researchers observe traffic patterns at an intersection over a month"
     ],
     "answer": "Researchers randomly assign patients to receive either a new drug or a placebo and compare outcomes",
     "explanation": "An experiment involves researchers deliberately imposing a treatment (the drug or placebo) on subjects; the other options only observe existing conditions.",
     "topic": "Sampling and Study Design",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u9-q33",
     "type": "tf",
     "prompt": "An observational study, where researchers only record existing variables without imposing any treatment, can establish that one variable causes a change in another.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Only a well-designed experiment with random assignment can establish cause and effect; observational studies can only show association.",
     "topic": "Sampling and Study Design",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "alg2-u10",
   "unit": 10,
   "title": "Trigonometric Functions",
   "summary": "Learn to place angles in standard position, convert fluently between degrees and radians, and find coterminal and reference angles. Master the unit circle's exact values, the sign patterns of sine, cosine, and tangent by quadrant, and how amplitude, period, and midline shape the graphs of y = sin x and y = cos x.",
   "topics": [
    "Angles and Radian Measure",
    "Coterminal and Reference Angles",
    "The Unit Circle",
    "Quadrant Signs",
    "Graphs of Sine and Cosine",
    "Amplitude, Period, and Midline"
   ],
   "terms": [
    {
     "term": "Standard position",
     "definition": "An angle positioned with its vertex at the origin and its initial side along the positive x-axis.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Initial side",
     "definition": "The ray of an angle in standard position that lies along the positive x-axis.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Terminal side",
     "definition": "The ray of an angle in standard position at which its rotation ends.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Radian",
     "definition": "A unit of angle measure equal to the central angle that subtends an arc length equal to the circle's radius.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Degree-radian conversion",
     "definition": "The relationship π radians = 180°, used to convert between the two angle units.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Negative angle",
     "definition": "An angle formed by rotating the terminal side clockwise from the initial side.",
     "topic": "Angles and Radian Measure"
    },
    {
     "term": "Coterminal angles",
     "definition": "Two or more angles in standard position that share the same terminal side.",
     "topic": "Coterminal and Reference Angles"
    },
    {
     "term": "Reference angle",
     "definition": "The acute angle formed between an angle's terminal side and the x-axis.",
     "topic": "Coterminal and Reference Angles"
    },
    {
     "term": "Unit circle",
     "definition": "A circle of radius 1 centered at the origin, used to define exact trigonometric values.",
     "topic": "The Unit Circle"
    },
    {
     "term": "Quadrantal angle",
     "definition": "An angle in standard position whose terminal side lies exactly on an axis, such as 0°, 90°, 180°, or 270°.",
     "topic": "The Unit Circle"
    },
    {
     "term": "Sine (unit circle definition)",
     "definition": "The y-coordinate of the point where an angle's terminal side meets the unit circle.",
     "topic": "The Unit Circle"
    },
    {
     "term": "Cosine (unit circle definition)",
     "definition": "The x-coordinate of the point where an angle's terminal side meets the unit circle.",
     "topic": "The Unit Circle"
    },
    {
     "term": "Tangent (unit circle definition)",
     "definition": "The y-coordinate divided by the x-coordinate of the unit-circle point; equals sin θ / cos θ.",
     "topic": "The Unit Circle"
    },
    {
     "term": "30-60-90 triangle",
     "definition": "A right triangle with side lengths in the ratio 1 : √3 : 2, used to find exact trig values at 30° and 60°.",
     "topic": "The Unit Circle"
    },
    {
     "term": "45-45-90 triangle",
     "definition": "A right triangle with side lengths in the ratio 1 : 1 : √2, used to find exact trig values at 45°.",
     "topic": "The Unit Circle"
    },
    {
     "term": "ASTC rule",
     "definition": "A memory device for which trig ratios are positive in each quadrant: All, then only sine, then only tangent, then only cosine.",
     "topic": "Quadrant Signs"
    },
    {
     "term": "Quadrant",
     "definition": "One of four regions of the coordinate plane formed by the x- and y-axes, numbered I through IV counterclockwise from the upper right.",
     "topic": "Quadrant Signs"
    },
    {
     "term": "Periodic function",
     "definition": "A function whose output values repeat in a regular, fixed interval as the input increases.",
     "topic": "Graphs of Sine and Cosine"
    },
    {
     "term": "Sinusoidal graph",
     "definition": "A smooth, repeating wave-shaped graph like those produced by sine and cosine.",
     "topic": "Graphs of Sine and Cosine"
    },
    {
     "term": "Amplitude",
     "definition": "Half the distance between a sinusoidal function's maximum and minimum values.",
     "topic": "Amplitude, Period, and Midline"
    },
    {
     "term": "Period (of a trig function)",
     "definition": "The horizontal length of one complete cycle before a repeating graph starts over.",
     "topic": "Amplitude, Period, and Midline"
    },
    {
     "term": "Midline",
     "definition": "The horizontal line exactly halfway between a sinusoidal function's maximum and minimum values.",
     "topic": "Amplitude, Period, and Midline"
    }
   ],
   "questions": [
    {
     "id": "alg2-u10-q1",
     "type": "mc",
     "prompt": "Convert 150° to radians.",
     "options": [
      "5π/6",
      "2π/3",
      "3π/4",
      "7π/6"
     ],
     "answer": "5π/6",
     "explanation": "150° × (π/180) = (150/180)π = 5π/6. Check: 5π/6 × (180/π) = 150° ✓",
     "topic": "Angles and Radian Measure",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q2",
     "type": "mc",
     "prompt": "Convert 2π/3 radians to degrees.",
     "options": [
      "120°",
      "60°",
      "135°",
      "150°"
     ],
     "answer": "120°",
     "explanation": "2π/3 × (180/π) = 2 × 60° = 120°. Check: 120° × (π/180) = 2π/3 ✓",
     "topic": "Angles and Radian Measure",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q3",
     "type": "mc",
     "prompt": "Which angle is coterminal with 400°?",
     "options": [
      "40°",
      "140°",
      "-40°",
      "320°"
     ],
     "answer": "40°",
     "explanation": "Subtract one full rotation: 400° − 360° = 40°, so 40° shares the same terminal side. The others differ from 400° by an amount that is not a multiple of 360°.",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q4",
     "type": "mc",
     "prompt": "What is the reference angle for 250°?",
     "options": [
      "70°",
      "110°",
      "250°",
      "20°"
     ],
     "answer": "70°",
     "explanation": "250° lies in Quadrant III (180°–270°), so the reference angle is 250° − 180° = 70°. Check: 70° is acute, as required. ✓",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q5",
     "type": "mc",
     "prompt": "What is the reference angle for 5π/4 radians?",
     "options": [
      "π/4",
      "3π/4",
      "π/3",
      "π/6"
     ],
     "answer": "π/4",
     "explanation": "5π/4 lies in Quadrant III (π to 3π/2), so the reference angle is 5π/4 − π = π/4. Check: π/4 is between 0 and π/2 ✓",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u10-q6",
     "type": "mc",
     "prompt": "What is the exact value of sin 30°?",
     "options": [
      "1/2",
      "√2/2",
      "√3/2",
      "1"
     ],
     "answer": "1/2",
     "explanation": "In a 30-60-90 triangle with hypotenuse 2, the side opposite 30° is 1, so sin 30° = 1/2.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q7",
     "type": "mc",
     "prompt": "What is the exact value of cos 45°?",
     "options": [
      "√2/2",
      "1/2",
      "√3/2",
      "1"
     ],
     "answer": "√2/2",
     "explanation": "In a 45-45-90 triangle with legs 1 and hypotenuse √2, cos 45° = 1/√2 = √2/2 after rationalizing.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q8",
     "type": "mc",
     "prompt": "What is the exact value of tan 60°?",
     "options": [
      "√3",
      "√3/3",
      "3",
      "√3/2"
     ],
     "answer": "√3",
     "explanation": "sin 60° = √3/2 and cos 60° = 1/2, so tan 60° = (√3/2) ÷ (1/2) = √3. Check: √3 ≈ 1.732, matches known value ✓",
     "topic": "The Unit Circle",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q9",
     "type": "mc",
     "prompt": "What is the value of sin 90°?",
     "options": [
      "1",
      "0",
      "-1",
      "undefined"
     ],
     "answer": "1",
     "explanation": "At 90°, the terminal side meets the unit circle at (0, 1), and sine is the y-coordinate, so sin 90° = 1.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q10",
     "type": "mc",
     "prompt": "What is the value of cos 180°?",
     "options": [
      "-1",
      "1",
      "0",
      "undefined"
     ],
     "answer": "-1",
     "explanation": "At 180°, the terminal side meets the unit circle at (-1, 0), and cosine is the x-coordinate, so cos 180° = -1.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q11",
     "type": "mc",
     "prompt": "What is the value of tan 90°?",
     "options": [
      "undefined",
      "0",
      "1",
      "-1"
     ],
     "answer": "undefined",
     "explanation": "tan 90° = sin 90°/cos 90° = 1/0, and division by zero is undefined.",
     "topic": "The Unit Circle",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q12",
     "type": "mc",
     "prompt": "If sin θ > 0 and cos θ < 0, in which quadrant does θ lie?",
     "options": [
      "II",
      "I",
      "III",
      "IV"
     ],
     "answer": "II",
     "explanation": "Sine is positive in QI and QII; cosine is negative in QII and QIII. The only quadrant satisfying both conditions is QII.",
     "topic": "Quadrant Signs",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q13",
     "type": "mc",
     "prompt": "In which quadrant are both sin θ and cos θ negative?",
     "options": [
      "III",
      "II",
      "IV",
      "I"
     ],
     "answer": "III",
     "explanation": "Sine is negative in QIII and QIV; cosine is negative in QII and QIII. Both are negative only in QIII.",
     "topic": "Quadrant Signs",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q14",
     "type": "mc",
     "prompt": "If cos θ > 0 and tan θ < 0, in which quadrant does θ lie?",
     "options": [
      "IV",
      "I",
      "II",
      "III"
     ],
     "answer": "IV",
     "explanation": "Cosine is positive in QI and QIV; tangent is negative in QII and QIV. Both conditions hold only in QIV.",
     "topic": "Quadrant Signs",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u10-q15",
     "type": "mc",
     "prompt": "What is the range of the function y = sin x?",
     "options": [
      "[-1, 1]",
      "[0, 1]",
      "(-∞, ∞)",
      "[-2, 2]"
     ],
     "answer": "[-1, 1]",
     "explanation": "The y-coordinates on the unit circle only ever range from -1 to 1, so sin x never leaves that interval.",
     "topic": "Graphs of Sine and Cosine",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q16",
     "type": "mc",
     "prompt": "What is the domain of the function y = cos x?",
     "options": [
      "all real numbers",
      "x ≥ 0",
      "[-1, 1]",
      "x ≠ 0"
     ],
     "answer": "all real numbers",
     "explanation": "An angle x can be any real number of radians, positive, negative, or zero, so cosine is defined everywhere.",
     "topic": "Graphs of Sine and Cosine",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q17",
     "type": "mc",
     "prompt": "What is the amplitude of y = 3 sin x?",
     "options": [
      "3",
      "1/3",
      "6",
      "-3"
     ],
     "answer": "3",
     "explanation": "Amplitude is the coefficient's absolute value in front of sin or cos, so amplitude = |3| = 3.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q18",
     "type": "mc",
     "prompt": "What is the period of y = sin(2x)?",
     "options": [
      "π",
      "2π",
      "4π",
      "π/2"
     ],
     "answer": "π",
     "explanation": "Period = 2π ÷ |b|, where b = 2, so period = 2π/2 = π. Check: sin(2(x + π)) = sin(2x + 2π) = sin(2x) ✓",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q19",
     "type": "mc",
     "prompt": "What is the period of y = cos(x/3)?",
     "options": [
      "6π",
      "2π/3",
      "3π",
      "2π"
     ],
     "answer": "6π",
     "explanation": "Period = 2π ÷ |b|, where b = 1/3, so period = 2π ÷ (1/3) = 2π × 3 = 6π.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u10-q20",
     "type": "mc",
     "prompt": "What is the midline of y = cos x + 4?",
     "options": [
      "y = 4",
      "y = 0",
      "y = -4",
      "y = 1"
     ],
     "answer": "y = 4",
     "explanation": "cos x oscillates between -1 and 1 around y = 0; adding 4 shifts every value up 4, so the new midline is y = 4.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q21",
     "type": "mc",
     "prompt": "A Ferris wheel's height in meters is modeled by h(t) = 15 sin(t) + 20. What is the maximum height it reaches?",
     "options": [
      "35 m",
      "15 m",
      "20 m",
      "5 m"
     ],
     "answer": "35 m",
     "explanation": "sin(t) has a maximum value of 1, so the maximum height is 15(1) + 20 = 15 + 20 = 35 m.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u10-q22",
     "type": "tf",
     "prompt": "One full rotation around a circle in standard position equals 2π radians.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A full circle is 360°, and 360° × (π/180) = 2π radians, so the statement is correct.",
     "topic": "Angles and Radian Measure",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q23",
     "type": "tf",
     "prompt": "180° is equivalent to π/2 radians.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "180° × (π/180) = π radians, not π/2. π/2 radians actually equals 90°.",
     "topic": "Angles and Radian Measure",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q24",
     "type": "tf",
     "prompt": "For an angle whose terminal side does not lie on an axis, the reference angle is always an acute angle, between 0° and 90°.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The reference angle is the acute angle between the terminal side and the x-axis. When the terminal side is not on an axis, that angle is always strictly between 0° and 90°.",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q25",
     "type": "tf",
     "prompt": "In Quadrant III, both sine and cosine are positive.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "In Quadrant III, both the x- and y-coordinates on the unit circle are negative, so both cosine and sine are negative, not positive.",
     "topic": "Quadrant Signs",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q26",
     "type": "tf",
     "prompt": "The point (0, 1) on the unit circle corresponds to the angle 90°.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "At 90°, cos 90° = 0 and sin 90° = 1, giving the point (cos θ, sin θ) = (0, 1), which matches.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q27",
     "type": "tf",
     "prompt": "The graph of y = sin x reaches its maximum value at x = 0.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "sin 0 = 0, not the maximum. The maximum value of 1 occurs at x = π/2.",
     "topic": "Graphs of Sine and Cosine",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q28",
     "type": "written",
     "prompt": "What is the reference angle, in degrees, for an angle of 200° in standard position?",
     "answer": "20",
     "accept": [
      "20°",
      "20 degrees"
     ],
     "explanation": "200° lies in Quadrant III (180°–270°), so the reference angle is 200° − 180° = 20°.",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q29",
     "type": "written",
     "prompt": "What is the smallest positive angle, in degrees, that is coterminal with -50°?",
     "answer": "310",
     "accept": [
      "310°",
      "310 degrees"
     ],
     "explanation": "Add one full rotation: -50° + 360° = 310°, which is the smallest positive coterminal angle.",
     "topic": "Coterminal and Reference Angles",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q30",
     "type": "written",
     "prompt": "What is the exact value of sin 0°?",
     "answer": "0",
     "accept": [
      "0.0"
     ],
     "explanation": "At 0°, the terminal side meets the unit circle at (1, 0), and sine is the y-coordinate, so sin 0° = 0.",
     "topic": "The Unit Circle",
     "difficulty": "easy"
    },
    {
     "id": "alg2-u10-q31",
     "type": "written",
     "prompt": "A point lies on the unit circle at an angle of 180°. What are its (x, y) coordinates?",
     "answer": "(-1, 0)",
     "accept": [
      "(-1,0)",
      "-1, 0",
      "-1,0",
      "-1 0",
      "x = -1, y = 0",
      "x=-1,y=0"
     ],
     "explanation": "cos 180° = -1 and sin 180° = 0, and unit circle coordinates are (cos θ, sin θ), giving (-1, 0).",
     "topic": "The Unit Circle",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q32",
     "type": "written",
     "prompt": "An angle θ, between 0° and 360°, satisfies cos θ = 0 and sin θ = -1. What is θ in degrees?",
     "answer": "270",
     "accept": [
      "270°",
      "270 degrees"
     ],
     "explanation": "On the unit circle, the point (0, -1) is reached after three-quarters of a full rotation, at θ = 270°. Check: cos 270° = 0 and sin 270° = -1 ✓",
     "topic": "Quadrant Signs",
     "difficulty": "medium"
    },
    {
     "id": "alg2-u10-q33",
     "type": "written",
     "prompt": "The function y = 4cos(x) − 1 has a midline y = c. What is the value of c?",
     "answer": "-1",
     "accept": [
      "y = -1",
      "y=-1",
      "c = -1"
     ],
     "explanation": "cos x oscillates around y = 0; subtracting 1 shifts the whole graph down 1 unit, so the midline is y = -1.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "hard"
    },
    {
     "id": "alg2-u10-q34",
     "type": "written",
     "prompt": "What is the amplitude of y = -5sin(x)?",
     "answer": "5",
     "accept": [
      "5.0"
     ],
     "explanation": "Amplitude is the absolute value of the coefficient in front of sine, so amplitude = |-5| = 5.",
     "topic": "Amplitude, Period, and Midline",
     "difficulty": "medium"
    }
   ]
  }
 ]
});
