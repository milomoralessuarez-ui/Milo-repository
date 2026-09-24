/* Algebra 1 — StudyQuest subject file, generated from standard high school curriculum content.
   Every question was written, then fact-checked item by item by a separate reviewer.
   Checked by: node tools/verify-study.mjs */
(window.STUDY_SUBJECTS = window.STUDY_SUBJECTS || []).push({
 "id": "alg1",
 "name": "Algebra 1",
 "emoji": "📈",
 "color": "#7c5cff",
 "blurb": "Expressions and equations, inequalities, functions and slope, systems, exponents, polynomials, factoring, quadratics, radicals and statistics.",
 "sets": [
  {
   "id": "alg1-u1",
   "unit": 1,
   "title": "Foundations of Algebra",
   "summary": "Build the toolkit every algebra course relies on: writing and evaluating expressions, applying the order of operations, and classifying numbers within the real number system. Practice the core properties (commutative, associative, distributive, identity, inverse), combine like terms, work with absolute value, and translate word phrases into algebra.",
   "topics": [
    "Variables & Expressions",
    "Order of Operations",
    "Real Number System",
    "Properties of Operations",
    "Combining Like Terms",
    "Evaluating Expressions",
    "Absolute Value & Word Problems"
   ],
   "terms": [
    {
     "term": "Variable",
     "definition": "A letter or symbol that stands for an unknown or changing numeric value.",
     "topic": "Variables & Expressions"
    },
    {
     "term": "Algebraic expression",
     "definition": "A mathematical phrase combining numbers, variables, and operations, with no equals sign.",
     "topic": "Variables & Expressions"
    },
    {
     "term": "Coefficient",
     "definition": "The numerical factor that multiplies a variable in a term.",
     "topic": "Variables & Expressions"
    },
    {
     "term": "Term",
     "definition": "A single number, variable, or product of numbers and variables within a larger expression.",
     "topic": "Variables & Expressions"
    },
    {
     "term": "Constant",
     "definition": "A part of an expression with a fixed numeric value and no variable attached.",
     "topic": "Variables & Expressions"
    },
    {
     "term": "Order of operations",
     "definition": "The agreed sequence for evaluating expressions: parentheses, exponents, multiplication/division, then addition/subtraction.",
     "topic": "Order of Operations"
    },
    {
     "term": "Exponent",
     "definition": "A raised number telling how many times the base is used as a factor, e.g. 2³ = 2·2·2.",
     "topic": "Order of Operations"
    },
    {
     "term": "Base (of a power)",
     "definition": "The number or variable used as a repeated factor; in 5³, it is 5.",
     "topic": "Order of Operations"
    },
    {
     "term": "Natural numbers",
     "definition": "The counting numbers starting at 1: 1, 2, 3, …",
     "topic": "Real Number System"
    },
    {
     "term": "Whole numbers",
     "definition": "The counting numbers together with zero: 0, 1, 2, 3, …",
     "topic": "Real Number System"
    },
    {
     "term": "Integers",
     "definition": "Whole numbers and their opposites, including zero, with no fractional or decimal part.",
     "topic": "Real Number System"
    },
    {
     "term": "Rational number",
     "definition": "Any number that can be written as a ratio of two integers, a/b, with b ≠ 0.",
     "topic": "Real Number System"
    },
    {
     "term": "Irrational number",
     "definition": "A number that cannot be written as a ratio of two integers; its decimal never repeats or ends.",
     "topic": "Real Number System"
    },
    {
     "term": "Real numbers",
     "definition": "All rational and irrational numbers together; every point on the number line.",
     "topic": "Real Number System"
    },
    {
     "term": "Commutative property",
     "definition": "Changing the order of the numbers being added or multiplied does not change the result.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Associative property",
     "definition": "Changing how numbers are grouped in addition or multiplication does not change the result.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Distributive property",
     "definition": "a(b + c) = ab + ac; multiplying a sum by a number equals multiplying each addend and then adding.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Identity property",
     "definition": "Adding 0 or multiplying by 1 leaves a number unchanged.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Inverse property",
     "definition": "a + (−a) = 0, and a · (1/a) = 1 for any a ≠ 0.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Like terms",
     "definition": "Terms that have the exact same variable(s) raised to the same power(s), so they can be combined.",
     "topic": "Combining Like Terms"
    },
    {
     "term": "Evaluate",
     "definition": "To find the numeric value of an expression by substituting given values for its variables.",
     "topic": "Evaluating Expressions"
    },
    {
     "term": "Substitution",
     "definition": "Replacing a variable in an expression with a given numeric value.",
     "topic": "Evaluating Expressions"
    },
    {
     "term": "Absolute value",
     "definition": "The distance a number is from 0 on the number line, always written as a nonnegative value.",
     "topic": "Absolute Value & Word Problems"
    },
    {
     "term": "Opposite (additive inverse)",
     "definition": "A value the same distance from zero as a given number, but on the other side of it on the number line; the two add to 0.",
     "topic": "Absolute Value & Word Problems"
    },
    {
     "term": "Reciprocal (multiplicative inverse)",
     "definition": "The number that, when multiplied by a given nonzero number, produces 1.",
     "topic": "Properties of Operations"
    },
    {
     "term": "Verbal expression",
     "definition": "A word phrase, such as \"5 more than a number,\" that can be translated into symbols and operations.",
     "topic": "Absolute Value & Word Problems"
    }
   ],
   "questions": [
    {
     "id": "alg1-u1-q1",
     "type": "mc",
     "prompt": "In the algebraic expression 7x + 3, what is the coefficient of x?",
     "options": [
      "7",
      "3",
      "x",
      "10"
     ],
     "answer": "7",
     "explanation": "The coefficient is the number multiplying the variable. In 7x + 3, the 7 multiplies x, so the coefficient is 7.",
     "topic": "Variables & Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q2",
     "type": "mc",
     "prompt": "According to the order of operations, which operation should be performed first in 5 + 3 × 2?",
     "options": [
      "Multiplication",
      "Addition",
      "Subtraction",
      "Division"
     ],
     "answer": "Multiplication",
     "explanation": "PEMDAS requires multiplication and division before addition and subtraction, so 3 × 2 = 6 is computed first, giving 5 + 6 = 11.",
     "topic": "Order of Operations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q3",
     "type": "mc",
     "prompt": "What is the value of 4 + (6 − 2)² ÷ 2?",
     "options": [
      "12",
      "20",
      "8",
      "6"
     ],
     "answer": "12",
     "explanation": "Parentheses first: 6 − 2 = 4. Exponent: 4² = 16. Division: 16 ÷ 2 = 8. Addition: 4 + 8 = 12.",
     "topic": "Order of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q4",
     "type": "mc",
     "prompt": "Which set includes numbers such as −3, 0, and 5, but never fractions or decimals?",
     "options": [
      "Integers",
      "Whole numbers",
      "Rational numbers",
      "Irrational numbers"
     ],
     "answer": "Integers",
     "explanation": "Integers are whole numbers and their opposites (…, −2, −1, 0, 1, 2, …); −3, 0, and 5 are all integers, while \"whole numbers\" excludes negatives like −3.",
     "topic": "Real Number System",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q5",
     "type": "mc",
     "prompt": "Which of the following numbers is irrational?",
     "options": [
      "√2",
      "0.25",
      "3/4",
      "√16"
     ],
     "answer": "√2",
     "explanation": "√2 ≈ 1.41421356… never terminates or repeats, so it cannot be written as a ratio of integers. Note √16 = 4, which is rational.",
     "topic": "Real Number System",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q6",
     "type": "mc",
     "prompt": "Which number is a whole number but not a natural number?",
     "options": [
      "0",
      "−1",
      "1/2",
      "2"
     ],
     "answer": "0",
     "explanation": "Whole numbers are 0, 1, 2, 3, …, while natural numbers start at 1. Zero is the only whole number that is not natural.",
     "topic": "Real Number System",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q7",
     "type": "mc",
     "prompt": "Which property is shown by 4 + 7 = 7 + 4?",
     "options": [
      "Commutative property",
      "Associative property",
      "Distributive property",
      "Identity property"
     ],
     "answer": "Commutative property",
     "explanation": "The commutative property says changing the order of the numbers being added does not change the sum.",
     "topic": "Properties of Operations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q8",
     "type": "mc",
     "prompt": "Which equation illustrates the distributive property?",
     "options": [
      "3(x + 5) = 3x + 15",
      "3 + (x + 5) = (3 + x) + 5",
      "3 · x = x · 3",
      "3 + 0 = 3"
     ],
     "answer": "3(x + 5) = 3x + 15",
     "explanation": "The distributive property multiplies each term inside the parentheses by the outside factor: 3·x + 3·5 = 3x + 15.",
     "topic": "Properties of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q9",
     "type": "mc",
     "prompt": "Which property is used in (2 + 5) + 8 = 2 + (5 + 8)?",
     "options": [
      "Associative property",
      "Commutative property",
      "Distributive property",
      "Inverse property"
     ],
     "answer": "Associative property",
     "explanation": "The associative property allows regrouping of addends without changing the sum; only the grouping changes, not the order.",
     "topic": "Properties of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q10",
     "type": "mc",
     "prompt": "Which pair of terms are like terms?",
     "options": [
      "3x and 5x",
      "3x and 5x²",
      "3x and 5y",
      "3xy and 5x"
     ],
     "answer": "3x and 5x",
     "explanation": "Like terms must have the same variable raised to the same power. Both 3x and 5x have x to the first power.",
     "topic": "Combining Like Terms",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q11",
     "type": "mc",
     "prompt": "Simplify: 4x + 7 − 2x + 3",
     "options": [
      "2x + 10",
      "6x + 10",
      "2x + 4",
      "6x + 4"
     ],
     "answer": "2x + 10",
     "explanation": "Combine like terms: (4x − 2x) = 2x and (7 + 3) = 10, giving 2x + 10.",
     "topic": "Combining Like Terms",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q12",
     "type": "mc",
     "prompt": "Evaluate 2x² − 3 when x = 3.",
     "options": [
      "15",
      "33",
      "21",
      "6"
     ],
     "answer": "15",
     "explanation": "Square first: 3² = 9. Then 2 × 9 = 18, and 18 − 3 = 15. (Squaring 2·3 first would wrongly give 36 − 3 = 33.)",
     "topic": "Evaluating Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q13",
     "type": "mc",
     "prompt": "Evaluate a + 3b when a = 4 and b = 2.",
     "options": [
      "10",
      "14",
      "9",
      "24"
     ],
     "answer": "10",
     "explanation": "Substitute the values: 4 + 3(2) = 4 + 6 = 10.",
     "topic": "Evaluating Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q14",
     "type": "mc",
     "prompt": "What is |−8|?",
     "options": [
      "8",
      "−8",
      "0",
      "16"
     ],
     "answer": "8",
     "explanation": "Absolute value measures distance from 0, which is always nonnegative, so |−8| = 8.",
     "topic": "Absolute Value & Word Problems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q15",
     "type": "mc",
     "prompt": "Which expression represents \"the product of 6 and a number, decreased by 4\"?",
     "options": [
      "6n − 4",
      "6 − 4n",
      "4 − 6n",
      "6n + 4"
     ],
     "answer": "6n − 4",
     "explanation": "\"Product of 6 and a number\" is 6n, and \"decreased by 4\" means subtract 4, giving 6n − 4.",
     "topic": "Absolute Value & Word Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q16",
     "type": "mc",
     "prompt": "A number's distance from 0 on the number line is 5. Which equation represents this, where x is the number?",
     "options": [
      "|x| = 5",
      "x = 5",
      "x + 5 = 0",
      "|x| = −5"
     ],
     "answer": "|x| = 5",
     "explanation": "Absolute value equals distance from zero, so a distance of 5 is written |x| = 5, which is true for both x = 5 and x = −5.",
     "topic": "Absolute Value & Word Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q17",
     "type": "tf",
     "prompt": "The expression 4x − 7 + 2y has three terms.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Terms are separated by + and − signs: 4x, −7, and 2y make three terms.",
     "topic": "Variables & Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q18",
     "type": "tf",
     "prompt": "In the expression 12 ÷ 4 × 3, the multiplication is done first, so the value is 1.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Multiplication and division have equal rank and are done left to right: 12 ÷ 4 = 3, then 3 × 3 = 9, not 1.",
     "topic": "Order of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q19",
     "type": "tf",
     "prompt": "Every integer is also a rational number.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Any integer n can be written as n/1, a ratio of two integers, so every integer is rational.",
     "topic": "Real Number System",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q20",
     "type": "tf",
     "prompt": "The repeating decimal 0.333… is a rational number.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "0.333… = 1/3, a ratio of two integers. Repeating decimals are rational; only decimals that never end and never repeat are irrational.",
     "topic": "Real Number System",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q21",
     "type": "tf",
     "prompt": "Subtraction is commutative, meaning a − b always equals b − a.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Subtraction is not commutative. For example, 5 − 3 = 2 but 3 − 5 = −2, and 2 ≠ −2.",
     "topic": "Properties of Operations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q22",
     "type": "tf",
     "prompt": "The terms 4x² and 4x are like terms because they share the same coefficient and variable.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Like terms must have the same variable raised to the same power. Since x² and x are different powers, these are not like terms.",
     "topic": "Combining Like Terms",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q23",
     "type": "tf",
     "prompt": "The absolute value of a number can be negative.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Absolute value represents distance from zero, and distance is never negative, so absolute value is always ≥ 0.",
     "topic": "Absolute Value & Word Problems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q24",
     "type": "written",
     "prompt": "Identify the coefficient in the term −9y.",
     "answer": "-9",
     "accept": [
      "−9",
      "- 9",
      "negative 9",
      "negative nine"
     ],
     "explanation": "The coefficient is the number multiplying the variable, including its sign; here −9 multiplies y.",
     "topic": "Variables & Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q25",
     "type": "written",
     "prompt": "Evaluate: 3 + 4 × 2²",
     "answer": "19",
     "accept": [],
     "explanation": "First square: 2² = 4. Then multiply: 4 × 4 = 16. Then add: 3 + 16 = 19.",
     "topic": "Order of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q26",
     "type": "written",
     "prompt": "How many integers are strictly between −3 and 3?",
     "answer": "5",
     "accept": [
      "five"
     ],
     "explanation": "The integers strictly between −3 and 3 are −2, −1, 0, 1, 2, which makes 5 integers (0 counts).",
     "topic": "Real Number System",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u1-q27",
     "type": "written",
     "prompt": "What is the multiplicative identity — the number that leaves any number unchanged when multiplied by it?",
     "answer": "1",
     "accept": [
      "one"
     ],
     "explanation": "Multiplying any number by 1 leaves it unchanged, so 1 is the multiplicative identity.",
     "topic": "Properties of Operations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u1-q28",
     "type": "mc",
     "prompt": "Simplify: 5x + 2y − 3x + y",
     "answer": "2x + 3y",
     "accept": [
      "2x+3y",
      "2x + 3y",
      "3y + 2x",
      "3y+2x"
     ],
     "explanation": "Combine the x-terms: 5x − 3x = 2x. Combine the y-terms: 2y + 1y = 3y. The result is 2x + 3y.",
     "topic": "Combining Like Terms",
     "difficulty": "medium",
     "options": [
      "2x + 3y",
      "2x + 2y",
      "8x + 3y",
      "8x + y"
     ]
    },
    {
     "id": "alg1-u1-q29",
     "type": "written",
     "prompt": "Evaluate the expression 3(x + 2) − 4 when x = 5.",
     "answer": "17",
     "accept": [],
     "explanation": "First add inside parentheses: 5 + 2 = 7. Multiply: 3 × 7 = 21. Subtract: 21 − 4 = 17.",
     "topic": "Evaluating Expressions",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u1-q30",
     "type": "written",
     "prompt": "Find the absolute value of the difference between 3 and 10, that is, |3 − 10|.",
     "answer": "7",
     "accept": [],
     "explanation": "3 − 10 = −7, and the absolute value (distance from 0) of −7 is 7.",
     "topic": "Absolute Value & Word Problems",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u2",
   "unit": 2,
   "title": "Solving Linear Equations",
   "summary": "Master one-step, two-step, and multi-step equations, including the distributive property, variables on both sides, and equations with no solution or infinitely many solutions. Then apply equation-solving to literal equations, ratios and proportions, and real-world percent problems.",
   "topics": [
    "One-Step & Two-Step Equations",
    "Multi-Step Equations & Distributive Property",
    "Variables on Both Sides",
    "Special Solutions (No Solution or Infinite Solutions)",
    "Literal Equations",
    "Ratios, Rates & Proportions",
    "Percent Problems"
   ],
   "terms": [
    {
     "term": "Equation",
     "definition": "A mathematical statement that two expressions are equal, connected by an equals sign.",
     "topic": "One-Step & Two-Step Equations"
    },
    {
     "term": "Inverse operations",
     "definition": "Operations that undo each other, such as addition and subtraction or multiplication and division.",
     "topic": "One-Step & Two-Step Equations"
    },
    {
     "term": "One-step equation",
     "definition": "An equation solved using a single inverse operation, such as x + 3 = 10.",
     "topic": "One-Step & Two-Step Equations"
    },
    {
     "term": "Two-step equation",
     "definition": "An equation solved using two inverse operations in sequence, such as 2x + 3 = 11.",
     "topic": "One-Step & Two-Step Equations"
    },
    {
     "term": "Multi-step equation",
     "definition": "An equation needing more than two steps to solve, such as distributing or combining like terms first.",
     "topic": "Multi-Step Equations & Distributive Property"
    },
    {
     "term": "Distributive property",
     "definition": "The rule a(b + c) = ab + ac, used to remove parentheses before solving.",
     "topic": "Multi-Step Equations & Distributive Property"
    },
    {
     "term": "Like terms",
     "definition": "Terms that have the same variable raised to the same power and can be combined by adding or subtracting coefficients.",
     "topic": "Multi-Step Equations & Distributive Property"
    },
    {
     "term": "Combining like terms",
     "definition": "Simplifying an expression by adding or subtracting terms with identical variable parts.",
     "topic": "Multi-Step Equations & Distributive Property"
    },
    {
     "term": "Coefficient",
     "definition": "The numerical factor multiplied by a variable in a term.",
     "topic": "Multi-Step Equations & Distributive Property"
    },
    {
     "term": "Variables on both sides",
     "definition": "An equation in which terms containing the unknown appear on each side of the equals sign.",
     "topic": "Variables on Both Sides"
    },
    {
     "term": "Isolate the variable",
     "definition": "Performing operations to get the unknown alone on one side of an equation.",
     "topic": "Variables on Both Sides"
    },
    {
     "term": "No solution",
     "definition": "The result when an equation simplifies to a false statement, such as 5 = 7, meaning no value works.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)"
    },
    {
     "term": "Infinitely many solutions",
     "definition": "The result when an equation simplifies to a true statement, such as 3 = 3, meaning every value works.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)"
    },
    {
     "term": "Identity (equation)",
     "definition": "An equation that is true for every value of the variable.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)"
    },
    {
     "term": "Contradiction (equation)",
     "definition": "An equation that is never true for any value of the variable.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)"
    },
    {
     "term": "Literal equation",
     "definition": "An equation with two or more variables, such as a formula, that is rearranged to solve for one specific variable.",
     "topic": "Literal Equations"
    },
    {
     "term": "Solve for a variable",
     "definition": "Rearranging an equation with several variables so that one chosen variable is isolated.",
     "topic": "Literal Equations"
    },
    {
     "term": "Ratio",
     "definition": "A comparison of two quantities by division, often written as a fraction or with a colon.",
     "topic": "Ratios, Rates & Proportions"
    },
    {
     "term": "Rate",
     "definition": "A comparison of two quantities measured in different units, such as miles per hour.",
     "topic": "Ratios, Rates & Proportions"
    },
    {
     "term": "Unit rate",
     "definition": "A rate simplified so the second quantity is 1, such as 60 miles per 1 hour.",
     "topic": "Ratios, Rates & Proportions"
    },
    {
     "term": "Proportion",
     "definition": "An equation stating that two ratios are equal.",
     "topic": "Ratios, Rates & Proportions"
    },
    {
     "term": "Cross multiplication",
     "definition": "A method for solving a proportion by multiplying the numerator of each ratio by the denominator of the other.",
     "topic": "Ratios, Rates & Proportions"
    },
    {
     "term": "Percent",
     "definition": "A ratio comparing a number to 100; for example, 45% means 45 per hundred.",
     "topic": "Percent Problems"
    },
    {
     "term": "Percent change",
     "definition": "(new − original) ÷ original × 100; positive means an increase, negative means a decrease.",
     "topic": "Percent Problems"
    },
    {
     "term": "Markup",
     "definition": "An increase added to the cost of an item to determine its selling price.",
     "topic": "Percent Problems"
    },
    {
     "term": "Discount",
     "definition": "A decrease subtracted from the original price of an item.",
     "topic": "Percent Problems"
    }
   ],
   "questions": [
    {
     "id": "alg1-u2-q1",
     "type": "mc",
     "prompt": "Solve for x: x + 7 = 15",
     "answer": "8",
     "options": [
      "8",
      "22",
      "-8",
      "-22"
     ],
     "explanation": "Subtract 7 from both sides: x = 15 − 7 = 8. Check: 8 + 7 = 15. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q2",
     "type": "mc",
     "prompt": "Solve for x: x/4 = 9",
     "answer": "36",
     "options": [
      "36",
      "2.25",
      "13",
      "5"
     ],
     "explanation": "Multiply both sides by 4: x = 9 · 4 = 36. Check: 36/4 = 9. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q3",
     "type": "mc",
     "prompt": "A taxi charges a flat $3 fee plus $2 per mile. A ride costs $17. How many miles was the ride?",
     "answer": "7",
     "options": [
      "7",
      "8.5",
      "10",
      "5.5"
     ],
     "explanation": "Set up 3 + 2m = 17. Subtract 3: 2m = 14. Divide by 2: m = 7. Check: 3 + 2(7) = 3 + 14 = 17. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q4",
     "type": "tf",
     "prompt": "To solve x − 9 = 4, you add 9 to both sides.",
     "answer": "True",
     "options": [
      "True",
      "False"
     ],
     "explanation": "Addition is the inverse of subtraction, so adding 9 to both sides gives x = 13. Check: 13 − 9 = 4. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q5",
     "type": "written",
     "prompt": "Solve for x: x + 12 = 5",
     "answer": "-7",
     "accept": [
      "−7",
      "x=-7",
      "x = -7",
      "x=−7",
      "x = −7"
     ],
     "explanation": "Subtract 12 from both sides: x = 5 − 12 = −7. Check: −7 + 12 = 5. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q6",
     "type": "written",
     "prompt": "Solve for x: 3x = −18",
     "answer": "-6",
     "accept": [
      "−6",
      "x=-6",
      "x = -6",
      "x=−6",
      "x = −6"
     ],
     "explanation": "Divide both sides by 3: x = −18/3 = −6. Check: 3(−6) = −18. ✓",
     "topic": "One-Step & Two-Step Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q7",
     "type": "mc",
     "prompt": "Solve for x: 5(x + 2) = 35",
     "answer": "5",
     "options": [
      "5",
      "6.6",
      "9",
      "25"
     ],
     "explanation": "Distribute: 5x + 10 = 35. Subtract 10: 5x = 25. Divide by 5: x = 5. Check: 5(5 + 2) = 5(7) = 35. ✓",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q8",
     "type": "mc",
     "prompt": "Solve for x: 2x + 3(x − 1) = 17",
     "answer": "4",
     "options": [
      "4",
      "3.6",
      "2.8",
      "3.4"
     ],
     "explanation": "Distribute: 2x + 3x − 3 = 17. Combine like terms: 5x − 3 = 17. Add 3: 5x = 20. Divide by 5: x = 4. Check: 2(4) + 3(4−1) = 8 + 9 = 17. ✓",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q9",
     "type": "mc",
     "prompt": "The perimeter of a rectangle is 54 cm. The length is 3 cm more than twice the width. What is the width?",
     "answer": "8 cm",
     "options": [
      "8 cm",
      "17 cm",
      "12 cm",
      "9 cm"
     ],
     "explanation": "Let w = width, so length = 2w + 3. Perimeter: 2[(2w+3) + w] = 54, so (2w+3) + w = 27, giving 3w + 3 = 27, 3w = 24, w = 8. Check: length = 2(8)+3 = 19, perimeter = 2(19+8) = 54. ✓",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u2-q10",
     "type": "tf",
     "prompt": "Distributing 3(x + 4) gives 3x + 7.",
     "answer": "False",
     "options": [
      "True",
      "False"
     ],
     "explanation": "False — distributing multiplies both terms inside by 3: 3(x + 4) = 3x + 12, not 3x + 7.",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q11",
     "type": "tf",
     "prompt": "4x and 4x² are like terms because they both contain the variable x.",
     "answer": "False",
     "options": [
      "True",
      "False"
     ],
     "explanation": "False — like terms need the variable raised to the same power. Here x has power 1 in 4x and power 2 in 4x², so they are not like terms.",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q12",
     "type": "written",
     "prompt": "Solve for x: 4x − 3 = 2x + 9",
     "answer": "6",
     "accept": [
      "x=6",
      "x = 6"
     ],
     "explanation": "Subtract 2x from both sides: 2x − 3 = 9. Add 3: 2x = 12. Divide by 2: x = 6. Check: 4(6)−3 = 21 and 2(6)+9 = 21. ✓",
     "topic": "Multi-Step Equations & Distributive Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q13",
     "type": "mc",
     "prompt": "Solve for x: 5x + 2 = 3x + 10",
     "answer": "4",
     "options": [
      "4",
      "-4",
      "1.5",
      "6"
     ],
     "explanation": "Subtract 3x from both sides: 2x + 2 = 10. Subtract 2: 2x = 8. Divide by 2: x = 4. Check: 5(4)+2 = 22 and 3(4)+10 = 22. ✓",
     "topic": "Variables on Both Sides",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q14",
     "type": "mc",
     "prompt": "Twice a number plus 7 equals the number minus 3. What is the number?",
     "answer": "-10",
     "options": [
      "-10",
      "10",
      "4",
      "-3.33"
     ],
     "explanation": "Let n be the number: 2n + 7 = n − 3. Subtract n: n + 7 = −3. Subtract 7: n = −10. Check: 2(−10)+7 = −13 and −10−3 = −13. ✓",
     "topic": "Variables on Both Sides",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q15",
     "type": "mc",
     "prompt": "Solve for x: 4(x − 1) = 2(x + 5)",
     "answer": "7",
     "options": [
      "7",
      "3",
      "-7",
      "2.33"
     ],
     "explanation": "Distribute both sides: 4x − 4 = 2x + 10. Subtract 2x: 2x − 4 = 10. Add 4: 2x = 14. Divide by 2: x = 7. Check: 4(7−1) = 24 and 2(7+5) = 24. ✓",
     "topic": "Variables on Both Sides",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u2-q16",
     "type": "tf",
     "prompt": "When solving an equation with variables on both sides, you can subtract a variable term from both sides to move it to one side.",
     "answer": "True",
     "options": [
      "True",
      "False"
     ],
     "explanation": "True — subtracting the same variable term from both sides keeps the equation balanced while collecting the variable on one side.",
     "topic": "Variables on Both Sides",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q17",
     "type": "written",
     "prompt": "A number tripled and increased by 4 equals 19 minus the number. Find the number.",
     "answer": "3.75",
     "accept": [
      "15/4",
      "3 3/4",
      "n=3.75",
      "n = 3.75",
      "n=15/4",
      "n = 15/4",
      "x=3.75",
      "x = 3.75",
      "x=15/4",
      "x = 15/4"
     ],
     "explanation": "Let n be the number: 3n + 4 = 19 − n. Add n: 4n + 4 = 19. Subtract 4: 4n = 15. Divide by 4: n = 15/4 = 3.75. Check: 3(3.75) + 4 = 15.25 and 19 − 3.75 = 15.25. ✓",
     "topic": "Variables on Both Sides",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u2-q18",
     "type": "mc",
     "prompt": "Which equation has NO solution?",
     "answer": "2x + 3 = 2x + 5",
     "options": [
      "2x + 3 = 2x + 5",
      "2x + 3 = 2x + 3",
      "2x + 3 = x + 5",
      "2x + 3 = 3x + 5"
     ],
     "explanation": "Subtracting 2x from both sides of 2x + 3 = 2x + 5 leaves 3 = 5, a false statement, so no value of x works. The other equations each simplify to a true identity or a single valid solution.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q19",
     "type": "mc",
     "prompt": "Which equation has infinitely many solutions?",
     "answer": "3(x + 2) = 3x + 6",
     "options": [
      "3(x + 2) = 3x + 6",
      "3(x + 2) = 3x + 5",
      "3(x + 2) = 2x + 6",
      "3(x + 2) = 3x + 2"
     ],
     "explanation": "Distributing gives 3x + 6 = 3x + 6, which is true for every x, so it has infinitely many solutions. The other equations either give a false statement or exactly one solution.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q20",
     "type": "mc",
     "prompt": "Maria correctly simplifies 6x + 4 = 6x − 2 and ends up with 4 = −2. What does this result tell her?",
     "answer": "The equation has no solution.",
     "options": [
      "The equation has no solution.",
      "The equation has infinitely many solutions.",
      "The solution is x = 0.",
      "She must have made an arithmetic error."
     ],
     "explanation": "When the variable terms cancel and leave a false numerical statement like 4 = −2, it means no value of x can ever make the original equation true.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q21",
     "type": "tf",
     "prompt": "The equation 2x + 5 = 2x + 5 has exactly one solution.",
     "answer": "False",
     "options": [
      "True",
      "False"
     ],
     "explanation": "False — both sides are identical for every value of x, so this equation has infinitely many solutions, not exactly one.",
     "topic": "Special Solutions (No Solution or Infinite Solutions)",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q22",
     "type": "mc",
     "prompt": "The area of a triangle is A = ½bh. Solve this literal equation for h.",
     "answer": "h = 2A/b",
     "options": [
      "h = 2A/b",
      "h = A/(2b)",
      "h = 2Ab",
      "h = A/2 − b"
     ],
     "explanation": "Multiply both sides by 2: 2A = bh. Divide both sides by b: h = 2A/b.",
     "topic": "Literal Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q23",
     "type": "mc",
     "prompt": "Solve the equation 3x + y = 12 for y.",
     "answer": "y = 12 − 3x",
     "options": [
      "y = 12 − 3x",
      "y = 12 + 3x",
      "y = 3x − 12",
      "y = (12 − x)/3"
     ],
     "explanation": "Subtract 3x from both sides of 3x + y = 12 to isolate y: y = 12 − 3x.",
     "topic": "Literal Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q24",
     "type": "mc",
     "prompt": "The circumference formula is C = 2πr. Solve for r.",
     "answer": "r = C/(2π)",
     "options": [
      "r = C/(2π)",
      "r = 2πC",
      "r = C − 2π",
      "r = π/(2C)"
     ],
     "explanation": "Divide both sides of C = 2πr by 2π to isolate r: r = C/(2π).",
     "topic": "Literal Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q25",
     "type": "tf",
     "prompt": "A literal equation contains more than one variable.",
     "answer": "True",
     "options": [
      "True",
      "False"
     ],
     "explanation": "True — a literal equation, such as a geometry formula, has two or more variables, and it is typically rearranged to solve for one of them.",
     "topic": "Literal Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q26",
     "type": "written",
     "prompt": "What is the name for an equation with two or more variables that is rearranged to solve for just one of them?",
     "answer": "literal equation",
     "accept": [
      "literal equations",
      "a literal equation",
      "literal"
     ],
     "explanation": "This is called a literal equation. Formulas such as A = ½bh are examples; solving one for a variable means isolating that variable while the others stay in the expression.",
     "topic": "Literal Equations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q27",
     "type": "mc",
     "prompt": "A recipe uses 2 cups of flour for every 3 cups of sugar. If you use 9 cups of sugar, how many cups of flour are needed?",
     "answer": "6 cups",
     "options": [
      "6 cups",
      "13.5 cups",
      "4.5 cups",
      "1.5 cups"
     ],
     "explanation": "Set up the proportion 2/3 = f/9. Cross multiply: 3f = 2(9) = 18, so f = 6. Check: 2/3 = 6/9. ✓",
     "topic": "Ratios, Rates & Proportions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q28",
     "type": "tf",
     "prompt": "In a proportion, cross multiplying means multiplying the numerator of one ratio by the denominator of the other.",
     "answer": "True",
     "options": [
      "True",
      "False"
     ],
     "explanation": "True — for a/b = c/d, cross multiplying gives a·d = b·c, pairing each numerator with the opposite denominator.",
     "topic": "Ratios, Rates & Proportions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q29",
     "type": "written",
     "prompt": "Write the ratio 15 : 20 in simplest form.",
     "answer": "3:4",
     "accept": [
      "3 : 4",
      "3/4",
      "3 / 4",
      "3 to 4"
     ],
     "explanation": "15 and 20 have a greatest common factor of 5: 15 ÷ 5 = 3 and 20 ÷ 5 = 4, so the simplified ratio is 3:4.",
     "topic": "Ratios, Rates & Proportions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q30",
     "type": "written",
     "prompt": "A car travels 180 miles in 3 hours at a constant speed. What is its unit rate in miles per hour?",
     "answer": "60",
     "accept": [
      "60 mph",
      "60mph",
      "60 miles per hour",
      "60 mi/h",
      "60 mi/hr",
      "60 miles/hour",
      "60 miles an hour"
     ],
     "explanation": "Divide distance by time: 180 ÷ 3 = 60 miles per hour. Check: 60 · 3 = 180. ✓",
     "topic": "Ratios, Rates & Proportions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q31",
     "type": "mc",
     "prompt": "What is 25% of 80?",
     "answer": "20",
     "options": [
      "20",
      "25",
      "32",
      "16"
     ],
     "explanation": "Change 25% to a decimal (0.25) and multiply: 0.25 × 80 = 20. Check: 20/80 = 0.25 = 25%. ✓",
     "topic": "Percent Problems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u2-q32",
     "type": "mc",
     "prompt": "A shirt originally costs $40 and is discounted by 15%. What is the sale price?",
     "answer": "$34",
     "options": [
      "$34",
      "$6",
      "$46",
      "$37"
     ],
     "explanation": "Find the discount: 0.15 × 40 = $6. Subtract from the original price: 40 − 6 = $34. Check: 34/40 = 0.85, matching an 85% remaining price. ✓",
     "topic": "Percent Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q33",
     "type": "tf",
     "prompt": "A 20% increase on $50 results in $60.",
     "answer": "True",
     "options": [
      "True",
      "False"
     ],
     "explanation": "True — 20% of 50 is 0.20 × 50 = 10, and 50 + 10 = 60.",
     "topic": "Percent Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u2-q34",
     "type": "written",
     "prompt": "A town's population of 200 increases by 8%. What is the new population?",
     "answer": "216",
     "accept": [
      "216 people",
      "216 residents"
     ],
     "explanation": "Find the increase: 0.08 × 200 = 16. Add it to the original: 200 + 16 = 216. Shortcut check: 1.08 × 200 = 216. ✓",
     "topic": "Percent Problems",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg1-u3",
   "unit": 3,
   "title": "Linear Inequalities",
   "summary": "Learn to solve and graph linear inequalities, including how the sign reverses when multiplying or dividing by a negative number. Master compound inequalities joined by \"and\"/\"or\" and absolute value equations and inequalities.",
   "topics": [
    "Inequality Symbols",
    "Solving Inequalities",
    "Reversing the Sign",
    "Graphing on a Number Line",
    "Compound Inequalities",
    "Absolute Value"
   ],
   "terms": [
    {
     "term": "Inequality",
     "definition": "A mathematical statement that compares two expressions using <, >, ≤, ≥, or ≠ instead of an equals sign.",
     "topic": "Inequality Symbols"
    },
    {
     "term": "Less than (<)",
     "definition": "A symbol showing one value is strictly smaller than another.",
     "topic": "Inequality Symbols"
    },
    {
     "term": "Greater than (>)",
     "definition": "A symbol showing one value is strictly larger than another.",
     "topic": "Inequality Symbols"
    },
    {
     "term": "Solution set",
     "definition": "All values of a variable that make an inequality a true statement.",
     "topic": "Inequality Symbols"
    },
    {
     "term": "Equivalent inequalities",
     "definition": "Statements with exactly the same solution set, such as 2x < 6 and x < 3.",
     "topic": "Solving Inequalities"
    },
    {
     "term": "Addition Property of Inequality",
     "definition": "Adding or subtracting the same number on both sides leaves the direction of the symbol unchanged.",
     "topic": "Solving Inequalities"
    },
    {
     "term": "Isolating the variable",
     "definition": "Using inverse operations until the unknown letter stands alone on one side.",
     "topic": "Solving Inequalities"
    },
    {
     "term": "Inverse operations",
     "definition": "Pairs of steps that undo each other, like addition and subtraction or multiplication and division.",
     "topic": "Solving Inequalities"
    },
    {
     "term": "Sign reversal",
     "definition": "Flipping an inequality symbol because both sides were multiplied or divided by a negative number.",
     "topic": "Reversing the Sign"
    },
    {
     "term": "Multiplication Property of Inequality",
     "definition": "Multiplying or dividing both sides by a positive keeps the direction; by a negative, it flips.",
     "topic": "Reversing the Sign"
    },
    {
     "term": "Open circle",
     "definition": "A graph marker showing an endpoint is not part of the solution, used for strict inequalities like < or >.",
     "topic": "Graphing on a Number Line"
    },
    {
     "term": "Closed circle",
     "definition": "A graph marker showing an endpoint is part of the solution, used for ≤ or ≥.",
     "topic": "Graphing on a Number Line"
    },
    {
     "term": "Ray",
     "definition": "The arrow-shaped part of a number-line graph showing every value in one direction from a point.",
     "topic": "Graphing on a Number Line"
    },
    {
     "term": "Boundary point",
     "definition": "The value on a number line where an inequality's solution region begins or ends.",
     "topic": "Graphing on a Number Line"
    },
    {
     "term": "Compound inequality",
     "definition": "Two conditions on a variable joined by \"and\" or \"or\" into one statement, like −2 < x ≤ 5.",
     "topic": "Compound Inequalities"
    },
    {
     "term": "Conjunction (and)",
     "definition": "A compound statement true only when both parts are true, graphed where the two solutions overlap.",
     "topic": "Compound Inequalities"
    },
    {
     "term": "Disjunction (or)",
     "definition": "A compound statement true when at least one part is true, graphed as the combined solutions of both parts.",
     "topic": "Compound Inequalities"
    },
    {
     "term": "Intersection",
     "definition": "The set of values that satisfy both parts of an \"and\" compound inequality.",
     "topic": "Compound Inequalities"
    },
    {
     "term": "Absolute value",
     "definition": "The distance a number is from zero on the number line, always zero or positive.",
     "topic": "Absolute Value"
    },
    {
     "term": "Absolute value equation",
     "definition": "A statement like |x − 2| = 5, solved by splitting into two cases: x − 2 = 5 or x − 2 = −5.",
     "topic": "Absolute Value"
    },
    {
     "term": "Absolute value inequality rules",
     "definition": "For a > 0: |x| < a means −a < x < a; |x| > a means x < −a or x > a.",
     "topic": "Absolute Value"
    },
    {
     "term": "Extraneous solution",
     "definition": "A value found while solving that does not actually satisfy the original equation.",
     "topic": "Absolute Value"
    }
   ],
   "questions": [
    {
     "id": "alg1-u3-q1",
     "type": "mc",
     "prompt": "Which symbol means \"greater than or equal to\"?",
     "options": [
      "≥",
      "≤",
      "≠",
      "<"
     ],
     "answer": "≥",
     "explanation": "The symbol ≥ combines greater than and equal to, so it includes the value itself and everything larger.",
     "topic": "Inequality Symbols",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q2",
     "type": "mc",
     "prompt": "The phrase \"x is at most 7\" is best written as:",
     "options": [
      "x ≤ 7",
      "x ≥ 7",
      "x < 7",
      "x > 7"
     ],
     "answer": "x ≤ 7",
     "explanation": "\"At most\" means the value cannot go higher than 7 but can equal 7, which is represented by ≤.",
     "topic": "Inequality Symbols",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q3",
     "type": "mc",
     "prompt": "Solve for x: x + 5 < 12",
     "options": [
      "x < 7",
      "x < 17",
      "x < −7",
      "x < 5"
     ],
     "answer": "x < 7",
     "explanation": "Subtract 5 from both sides: x < 12 − 5, so x < 7. Check: 12 − 5 = 7 ✓.",
     "topic": "Solving Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q4",
     "type": "mc",
     "prompt": "Solve for x: 3x ≥ 21",
     "options": [
      "x ≥ 7",
      "x ≥ 63",
      "x ≥ 18",
      "x ≥ 24"
     ],
     "answer": "x ≥ 7",
     "explanation": "Divide both sides by 3, a positive number, so the sign stays the same: x ≥ 21 ÷ 3 = 7.",
     "topic": "Solving Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q5",
     "type": "mc",
     "prompt": "Solve for x: −4x > 20",
     "options": [
      "x < −5",
      "x > −5",
      "x < 5",
      "x > 5"
     ],
     "answer": "x < −5",
     "explanation": "Divide both sides by −4 and flip the sign: x < 20 ÷ (−4) = −5. Check: −4(−6) = 24 > 20 ✓.",
     "topic": "Reversing the Sign",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q6",
     "type": "mc",
     "prompt": "When solving −x/3 ≤ 6 by multiplying both sides by −3, what happens to the inequality symbol?",
     "options": [
      "It reverses to ≥",
      "It stays ≤",
      "It becomes =",
      "It becomes <"
     ],
     "answer": "It reverses to ≥",
     "explanation": "Multiplying or dividing both sides of an inequality by a negative number always flips the direction of the symbol.",
     "topic": "Reversing the Sign",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q7",
     "type": "mc",
     "prompt": "A taxi charges a $3 flat fee plus $2 per mile. Which inequality represents a ride that costs at most $25, where m is the number of miles?",
     "options": [
      "3 + 2m ≤ 25",
      "3 + 2m ≥ 25",
      "3m + 2 ≤ 25",
      "3 + 2m < 25"
     ],
     "answer": "3 + 2m ≤ 25",
     "explanation": "The total cost is the flat fee plus $2 per mile, 3 + 2m. \"At most $25\" means the total can equal 25 but not go over it, so use ≤: 3 + 2m ≤ 25.",
     "topic": "Solving Inequalities",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q8",
     "type": "mc",
     "prompt": "Which graph correctly represents x < 4?",
     "options": [
      "Open circle at 4, shaded to the left",
      "Closed circle at 4, shaded to the left",
      "Open circle at 4, shaded to the right",
      "Closed circle at 4, shaded to the right"
     ],
     "answer": "Open circle at 4, shaded to the left",
     "explanation": "4 itself is not included in x < 4, so the circle is open. The solutions are numbers smaller than 4, so the shading goes to the left.",
     "topic": "Graphing on a Number Line",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q9",
     "type": "mc",
     "prompt": "The graph of x ≥ −2 has a closed circle at −2 and a ray pointing:",
     "options": [
      "right, toward positive numbers",
      "left, toward negative numbers",
      "in both directions",
      "nowhere, it is a single point"
     ],
     "answer": "right, toward positive numbers",
     "explanation": "x ≥ −2 includes −2 and every number greater than it, so the ray extends to the right.",
     "topic": "Graphing on a Number Line",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q10",
     "type": "mc",
     "prompt": "Which compound inequality means \"x is between −3 and 5, including both endpoints\"?",
     "options": [
      "−3 ≤ x ≤ 5",
      "−3 < x < 5",
      "−3 ≤ x < 5",
      "x ≤ −3 or x ≥ 5"
     ],
     "answer": "−3 ≤ x ≤ 5",
     "explanation": "Including both endpoints requires ≤ on both sides, giving −3 ≤ x ≤ 5.",
     "topic": "Compound Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q11",
     "type": "mc",
     "prompt": "Solve the compound inequality: 2 < x + 3 < 9",
     "options": [
      "−1 < x < 6",
      "−1 < x < 9",
      "5 < x < 12",
      "−1 < x < 12"
     ],
     "answer": "−1 < x < 6",
     "explanation": "Subtract 3 from all three parts: 2 − 3 < x < 9 − 3, so −1 < x < 6. Check: x = 0 gives 0 + 3 = 3, and 2 < 3 < 9 ✓.",
     "topic": "Compound Inequalities",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q12",
     "type": "mc",
     "prompt": "Which description matches the graph of x < −1 or x > 3?",
     "options": [
      "Two rays pointing outward from open circles at −1 and 3",
      "One segment between −1 and 3 with closed circles",
      "A single ray to the right of 3 only",
      "Two rays pointing inward toward −1 and 3"
     ],
     "answer": "Two rays pointing outward from open circles at −1 and 3",
     "explanation": "An \"or\" compound inequality graphs each part separately, so the rays point away from −1 and 3 with open circles since neither symbol includes equality.",
     "topic": "Compound Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q13",
     "type": "mc",
     "prompt": "Solve: |x| = 6",
     "options": [
      "x = 6 or x = −6",
      "x = 6 only",
      "x = −6 only",
      "x = 0"
     ],
     "answer": "x = 6 or x = −6",
     "explanation": "Both 6 and −6 are exactly 6 units from zero, so both values satisfy |x| = 6.",
     "topic": "Absolute Value",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q14",
     "type": "mc",
     "prompt": "Solve: |x − 2| < 5",
     "options": [
      "−3 < x < 7",
      "−7 < x < 3",
      "−3 < x < 5",
      "x < −3 or x > 7"
     ],
     "answer": "−3 < x < 7",
     "explanation": "Rewrite as the compound inequality −5 < x − 2 < 5, then add 2 to all parts: −3 < x < 7.",
     "topic": "Absolute Value",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q15",
     "type": "mc",
     "prompt": "Solve: |2x| ≥ 8",
     "options": [
      "x ≤ −4 or x ≥ 4",
      "−4 ≤ x ≤ 4",
      "x ≤ −8 or x ≥ 8",
      "x ≥ 4 only"
     ],
     "answer": "x ≤ −4 or x ≥ 4",
     "explanation": "Split into 2x ≥ 8 or 2x ≤ −8, then divide each by 2 to get x ≥ 4 or x ≤ −4.",
     "topic": "Absolute Value",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q16",
     "type": "mc",
     "prompt": "What is the solution to |x + 1| = −3?",
     "options": [
      "No solution",
      "x = −4",
      "x = 2",
      "x = −4 or x = 2"
     ],
     "answer": "No solution",
     "explanation": "Absolute value is a distance, so it can never be negative. That means |x + 1| can never equal −3. (Setting x + 1 = ±3 gives −4 and 2, but |−4 + 1| = 3 and |2 + 1| = 3, not −3.)",
     "topic": "Absolute Value",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q17",
     "type": "tf",
     "prompt": "The symbol ≠ means \"not equal to.\"",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "≠ is used to show that two expressions do not have the same value.",
     "topic": "Inequality Symbols",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q18",
     "type": "tf",
     "prompt": "The symbol < means \"greater than.\"",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The symbol < means \"less than\"; \"greater than\" is represented by >.",
     "topic": "Inequality Symbols",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q19",
     "type": "tf",
     "prompt": "Adding the same number to both sides of an inequality never changes its direction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Addition and subtraction shift both sides equally, so the relationship between them, and the direction of the inequality, stays the same.",
     "topic": "Solving Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q20",
     "type": "tf",
     "prompt": "Dividing both sides of an inequality by a positive number reverses the inequality sign.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Dividing by a positive number keeps the direction the same; only dividing or multiplying by a negative number reverses the sign.",
     "topic": "Reversing the Sign",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q21",
     "type": "tf",
     "prompt": "A closed circle on a number line graph means the endpoint is included in the solution.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A closed (filled-in) circle is used for ≤ or ≥ to show that the endpoint itself is part of the solution.",
     "topic": "Graphing on a Number Line",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u3-q22",
     "type": "tf",
     "prompt": "For a compound \"or\" inequality, a value is a solution only if it satisfies both parts at the same time.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "An \"or\" compound inequality only requires at least one part to be true; requiring both parts describes an \"and\" inequality instead.",
     "topic": "Compound Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q23",
     "type": "tf",
     "prompt": "The inequality |x| > 3 means x is more than 3 units away from zero.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Absolute value measures distance from zero, so |x| > 3 describes all numbers farther than 3 units from zero in either direction.",
     "topic": "Absolute Value",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q24",
     "type": "written",
     "prompt": "Solve for x: 5x − 3 > 12. Write your answer as an inequality (e.g., x > 5).",
     "answer": "x > 3",
     "accept": [
      "x>3",
      "3 < x",
      "3<x"
     ],
     "explanation": "Add 3 to both sides: 5x > 15. Then divide by 5: x > 3. Check: 5(4) − 3 = 17 > 12 ✓.",
     "topic": "Solving Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q25",
     "type": "written",
     "prompt": "Solve for x: −2x < 10. Write your answer as an inequality (e.g., x > 5).",
     "answer": "x > -5",
     "accept": [
      "x>-5",
      "x > −5",
      "x>−5",
      "-5 < x",
      "-5<x",
      "−5 < x",
      "−5<x"
     ],
     "explanation": "Divide both sides by −2 and flip the sign: x > 10 ÷ (−2) = −5. Check: x = 0 gives −2(0) = 0 < 10 ✓, and 0 > −5.",
     "topic": "Reversing the Sign",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q26",
     "type": "tf",
     "prompt": "On the number-line graph of x ≤ 3, the circle drawn at 3 is closed (filled in).",
     "answer": "True",
     "accept": [],
     "explanation": "Because ≤ includes the value 3 itself, the endpoint is shown with a closed (filled-in) circle.",
     "topic": "Graphing on a Number Line",
     "difficulty": "easy",
     "options": [
      "True",
      "False"
     ]
    },
    {
     "id": "alg1-u3-q27",
     "type": "written",
     "prompt": "Solve the compound inequality: −5 ≤ 2x + 1 ≤ 9. Give the answer in the form a ≤ x ≤ b (you may type <= for ≤).",
     "answer": "-3 <= x <= 4",
     "accept": [
      "-3<=x<=4",
      "-3 ≤ x ≤ 4",
      "-3≤x≤4",
      "−3 ≤ x ≤ 4",
      "−3≤x≤4",
      "−3<=x<=4",
      "−3 <= x <= 4"
     ],
     "explanation": "Subtract 1 from all three parts: −6 ≤ 2x ≤ 8. Then divide by 2: −3 ≤ x ≤ 4. Check: x = 4 gives 2(4) + 1 = 9 ✓, and x = −3 gives 2(−3) + 1 = −5 ✓.",
     "topic": "Compound Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u3-q28",
     "type": "written",
     "prompt": "Solve |x − 4| = 9. This equation has two solutions; type the larger one.",
     "answer": "13",
     "accept": [
      "x=13",
      "x = 13"
     ],
     "explanation": "Split into x − 4 = 9, giving x = 13, or x − 4 = −9, giving x = −5. The larger solution is 13. Check: |13 − 4| = 9 ✓.",
     "topic": "Absolute Value",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q29",
     "type": "written",
     "prompt": "A manufactured part must weigh 50 grams with a tolerance of ±3 grams, written as |w − 50| ≤ 3. What is the minimum acceptable weight in grams?",
     "answer": "47",
     "accept": [
      "47 grams",
      "47 g",
      "47g",
      "w=47",
      "w = 47",
      "47 grams."
     ],
     "explanation": "The inequality expands to −3 ≤ w − 50 ≤ 3. Adding 50 to all parts gives 47 ≤ w ≤ 53, so the minimum weight is 50 − 3 = 47 grams.",
     "topic": "Absolute Value",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u3-q30",
     "type": "written",
     "prompt": "Write the inequality that represents: \"a number x is no more than 8.\" (You may type <= for ≤.)",
     "answer": "x <= 8",
     "accept": [
      "x<=8",
      "x ≤ 8",
      "x≤8",
      "x ≤8",
      "8 >= x",
      "8>=x",
      "8 ≥ x",
      "8≥x"
     ],
     "explanation": "\"No more than 8\" means x cannot be greater than 8 but can equal 8, so it is written x ≤ 8.",
     "topic": "Inequality Symbols",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "alg1-u4",
   "unit": 4,
   "title": "Relations and Functions",
   "summary": "Learn to tell relations from functions, find domain and range, and check functions with the vertical line test, mapping diagrams, and tables. You'll also use function notation like f(x), identify independent and dependent variables, and write formulas for arithmetic sequences.",
   "topics": [
    "Relations and Functions",
    "Domain and Range",
    "Vertical Line Test",
    "Mapping Diagrams and Tables",
    "Function Notation",
    "Independent and Dependent Variables",
    "Arithmetic Sequences"
   ],
   "terms": [
    {
     "term": "Relation",
     "definition": "A set of ordered pairs that pairs input values with output values.",
     "topic": "Relations and Functions"
    },
    {
     "term": "Function",
     "definition": "A relation in which each input value has exactly one output value.",
     "topic": "Relations and Functions"
    },
    {
     "term": "Input",
     "definition": "The value placed into a relation or function, often called the x-value.",
     "topic": "Relations and Functions"
    },
    {
     "term": "Output",
     "definition": "The result produced for a given input, often called the y-value.",
     "topic": "Relations and Functions"
    },
    {
     "term": "Ordered pair",
     "definition": "Two numbers written as (x, y) that show an input paired with its matching output.",
     "topic": "Relations and Functions"
    },
    {
     "term": "One-to-one function",
     "definition": "A function in which every output value corresponds to exactly one input value.",
     "topic": "Relations and Functions"
    },
    {
     "term": "Domain",
     "definition": "The complete set of input values for which a relation or function is defined.",
     "topic": "Domain and Range"
    },
    {
     "term": "Range",
     "definition": "The complete set of output values produced by a relation or function.",
     "topic": "Domain and Range"
    },
    {
     "term": "Vertical line test",
     "definition": "A graph shows a function if no line parallel to the y-axis crosses it more than once.",
     "topic": "Vertical Line Test"
    },
    {
     "term": "Mapping diagram",
     "definition": "A diagram with two ovals that uses arrows to connect each input to its matching output.",
     "topic": "Mapping Diagrams and Tables"
    },
    {
     "term": "Function table",
     "definition": "Rows or columns listing input values alongside the single output each one produces.",
     "topic": "Mapping Diagrams and Tables"
    },
    {
     "term": "Function notation",
     "definition": "Writing a rule as f(x), which names the rule and shows the input; f(x) is the output.",
     "topic": "Function Notation"
    },
    {
     "term": "f(x)",
     "definition": "Read as \"f of x\"; represents the output produced by function f for the input x.",
     "topic": "Function Notation"
    },
    {
     "term": "Evaluate a function",
     "definition": "To calculate the output value produced for a specific input value.",
     "topic": "Function Notation"
    },
    {
     "term": "Independent variable",
     "definition": "The input quantity in a relationship; its value is chosen freely and is usually x.",
     "topic": "Independent and Dependent Variables"
    },
    {
     "term": "Dependent variable",
     "definition": "The output quantity in a relationship; its value is determined by the input and is usually y.",
     "topic": "Independent and Dependent Variables"
    },
    {
     "term": "Sequence",
     "definition": "An ordered list of numbers, where each number in the list is called a term.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Arithmetic sequence",
     "definition": "A list of numbers with a constant difference between each pair of consecutive entries.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Common difference",
     "definition": "The constant amount added to one entry of an arithmetic sequence to get the next.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Explicit formula",
     "definition": "A rule giving any entry of a sequence directly from its position n, e.g. aₙ = a₁ + (n − 1)d.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Term (of a sequence)",
     "definition": "A single number in an ordered list, identified by its position, such as first or fifth.",
     "topic": "Arithmetic Sequences"
    },
    {
     "term": "Recursive formula",
     "definition": "A rule giving a starting value and finding each later entry from the entry right before it.",
     "topic": "Arithmetic Sequences"
    }
   ],
   "questions": [
    {
     "id": "alg1-u4-q1",
     "type": "mc",
     "prompt": "Which set of ordered pairs represents a function?",
     "options": [
      "{(1,2), (2,4), (3,6), (1,8)}",
      "{(1,2), (2,4), (3,6), (4,8)}",
      "{(2,1), (2,3), (2,5), (2,7)}",
      "{(0,0), (0,1), (0,2), (0,3)}"
     ],
     "answer": "{(1,2), (2,4), (3,6), (4,8)}",
     "explanation": "A function cannot repeat an input with two different outputs. Only the second set has all different inputs (1,2,3,4), each paired with exactly one output.",
     "topic": "Relations and Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q2",
     "type": "mc",
     "prompt": "A relation contains the ordered pairs (3, 5), (4, 7), (3, 9), and (6, 2). Why is this relation NOT a function?",
     "options": [
      "The input 3 is paired with two different outputs",
      "The output 5 is paired with two different inputs",
      "There are more inputs than outputs",
      "The ordered pairs are not listed in order"
     ],
     "answer": "The input 3 is paired with two different outputs",
     "explanation": "The input 3 appears twice, once with output 5 and once with output 9, so it fails the definition of a function.",
     "topic": "Relations and Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q3",
     "type": "mc",
     "prompt": "A graph fails the vertical line test. What does this tell you about the graph?",
     "options": [
      "It does not represent a function",
      "It represents a function",
      "It is a straight line",
      "It has no domain"
     ],
     "answer": "It does not represent a function",
     "explanation": "Failing the vertical line test means some vertical line crosses the graph more than once, so at least one input has two outputs — that is not a function.",
     "topic": "Vertical Line Test",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q4",
     "type": "mc",
     "prompt": "Which of these graphs will always pass the vertical line test?",
     "options": [
      "A circle",
      "A vertical line x = 3",
      "A parabola opening upward, y = x²",
      "A sideways parabola x = y²"
     ],
     "answer": "A parabola opening upward, y = x²",
     "explanation": "For y = x², every vertical line crosses the curve exactly once, so it passes the test. Circles, vertical lines, and sideways parabolas all have some vertical line crossing them twice.",
     "topic": "Vertical Line Test",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q5",
     "type": "mc",
     "prompt": "What is the domain of the relation {(-2, 1), (0, 3), (2, 5), (4, 7)}?",
     "options": [
      "{-2, 0, 2, 4}",
      "{1, 3, 5, 7}",
      "{-2, 4}",
      "{1, 7}"
     ],
     "answer": "{-2, 0, 2, 4}",
     "explanation": "The domain is the set of all input (first-coordinate) values: -2, 0, 2, and 4.",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q6",
     "type": "mc",
     "prompt": "What is the range of f(x) = x² for the domain {-2, -1, 0, 1, 2}?",
     "options": [
      "{0, 1, 4}",
      "{-2, -1, 0, 1, 2}",
      "{0, 1, 2, 4}",
      "{1, 4}"
     ],
     "answer": "{0, 1, 4}",
     "explanation": "Evaluating gives f(-2)=4, f(-1)=1, f(0)=0, f(1)=1, f(2)=4. Listing each output once (a set) gives {0, 1, 4}.",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q7",
     "type": "mc",
     "prompt": "In a mapping diagram, what do the arrows represent?",
     "options": [
      "The pairing of each input to its output",
      "The order of the inputs from least to greatest",
      "The difference between consecutive outputs",
      "The domain of the relation only"
     ],
     "answer": "The pairing of each input to its output",
     "explanation": "Each arrow in a mapping diagram connects one value in the input oval to the output value it is paired with.",
     "topic": "Mapping Diagrams and Tables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q8",
     "type": "mc",
     "prompt": "A function table lists inputs x: 1, 2, 3, 4 with outputs y: 3, 5, 7, 9. What is the output when the input is 3?",
     "options": [
      "7",
      "5",
      "9",
      "3"
     ],
     "answer": "7",
     "explanation": "The table pairs 3 with 7 (the third column), so the output for input 3 is 7.",
     "topic": "Mapping Diagrams and Tables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q9",
     "type": "mc",
     "prompt": "If f(x) = 2x + 3, what does f(4) represent?",
     "options": [
      "The output of the function when the input is 4",
      "The input of the function when the output is 4",
      "The slope of the function",
      "The value of x when f(x) = 0"
     ],
     "answer": "The output of the function when the input is 4",
     "explanation": "In function notation, f(4) means \"substitute 4 for x and find the resulting output value.\"",
     "topic": "Function Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q10",
     "type": "mc",
     "prompt": "If f(x) = 3x − 5, what is f(4)?",
     "options": [
      "7",
      "12",
      "17",
      "-3"
     ],
     "answer": "7",
     "explanation": "Substitute x = 4: 3(4) − 5 = 12 − 5 = 7. Double-check: 3×4=12, 12−5=7.",
     "topic": "Function Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q11",
     "type": "mc",
     "prompt": "If g(x) = x² − 2x + 1, what is g(3)?",
     "options": [
      "4",
      "16",
      "1",
      "10"
     ],
     "answer": "4",
     "explanation": "Substitute x = 3: 3² − 2(3) + 1 = 9 − 6 + 1 = 4. Double-check: 9 − 6 = 3, 3 + 1 = 4.",
     "topic": "Function Notation",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u4-q12",
     "type": "mc",
     "prompt": "In the equation y = 3x + 1, which variable is the independent variable?",
     "options": [
      "x",
      "y",
      "3",
      "1"
     ],
     "answer": "x",
     "explanation": "The independent variable is the input, chosen freely; here that is x, since y depends on it.",
     "topic": "Independent and Dependent Variables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q13",
     "type": "mc",
     "prompt": "A study finds that the amount of money a worker earns depends on the number of hours worked. Which is the dependent variable?",
     "options": [
      "Money earned",
      "Hours worked",
      "Both are independent",
      "Neither is a variable"
     ],
     "answer": "Money earned",
     "explanation": "Money earned is the dependent variable because its value depends on (is determined by) the number of hours worked.",
     "topic": "Independent and Dependent Variables",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q14",
     "type": "mc",
     "prompt": "What is the common difference in the arithmetic sequence 5, 8, 11, 14, …?",
     "options": [
      "3",
      "5",
      "8",
      "2"
     ],
     "answer": "3",
     "explanation": "Subtract consecutive terms: 8 − 5 = 3 and 11 − 8 = 3, so the common difference is 3.",
     "topic": "Arithmetic Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q15",
     "type": "mc",
     "prompt": "An arithmetic sequence has first term a₁ = 4 and common difference d = 5. What is the 6th term?",
     "options": [
      "29",
      "34",
      "25",
      "24"
     ],
     "answer": "29",
     "explanation": "Use aₙ = a₁ + (n − 1)d: a₆ = 4 + (6 − 1)(5) = 4 + 25 = 29. Double-check: 5×5=25, 25+4=29.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q16",
     "type": "mc",
     "prompt": "A sequence has explicit formula aₙ = 7 + (n − 1)(−3). What is a₅?",
     "options": [
      "-5",
      "-8",
      "-2",
      "19"
     ],
     "answer": "-5",
     "explanation": "Substitute n = 5: a₅ = 7 + (5 − 1)(−3) = 7 + 4(−3) = 7 − 12 = −5. Double-check: 4×(−3)=−12, 7−12=−5.",
     "topic": "Arithmetic Sequences",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u4-q17",
     "type": "tf",
     "prompt": "Every function is a relation.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A function is simply a relation that follows an extra rule (each input has one output), so all functions are relations.",
     "topic": "Relations and Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q18",
     "type": "tf",
     "prompt": "Every relation is a function.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Only relations where each input has exactly one output are functions; a relation can repeat an input with different outputs and still be a relation.",
     "topic": "Relations and Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q19",
     "type": "tf",
     "prompt": "The domain of a function is the set of all output values.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The domain is the set of all input values; the set of output values is called the range.",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q20",
     "type": "tf",
     "prompt": "If a vertical line intersects a graph at two points, the graph does not represent a function.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A vertical line crossing the graph twice means one input has two outputs, which violates the definition of a function.",
     "topic": "Vertical Line Test",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q21",
     "type": "tf",
     "prompt": "In a mapping diagram, if one input has arrows to two different outputs, the diagram does not represent a function.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A function requires each input to map to exactly one output, so two arrows from the same input mean it is not a function.",
     "topic": "Mapping Diagrams and Tables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q22",
     "type": "tf",
     "prompt": "In function notation f(x), the x represents the output value.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "In f(x), x represents the input value; f(x) itself represents the output produced for that input.",
     "topic": "Function Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q23",
     "type": "tf",
     "prompt": "The dependent variable is usually plotted on the y-axis.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "By convention, the independent variable is graphed on the x-axis and the dependent variable, whose value depends on it, is graphed on the y-axis.",
     "topic": "Independent and Dependent Variables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q24",
     "type": "tf",
     "prompt": "In an arithmetic sequence, you find the next term by multiplying the previous term by a constant.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "An arithmetic sequence finds the next term by adding a constant common difference; multiplying by a constant describes a geometric sequence instead.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q25",
     "type": "written",
     "prompt": "For the function f = {(1, 3), (2, 5), (3, 7), (4, 9)}, which input value has an output of 5?",
     "answer": "2",
     "accept": [
      "x=2",
      "x = 2"
     ],
     "explanation": "The pair (2, 5) has output 5, and its first coordinate (the input) is 2.",
     "topic": "Relations and Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q26",
     "type": "written",
     "prompt": "If f(x) = 5x − 2, what is f(3)?",
     "answer": "13",
     "accept": [
      "f(3)=13",
      "f(3) = 13"
     ],
     "explanation": "Substitute x = 3: 5(3) − 2 = 15 − 2 = 13. Double-check: 5×3=15, 15−2=13.",
     "topic": "Function Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q27",
     "type": "written",
     "prompt": "If h(x) = x² + 4, what is h(-2)?",
     "answer": "8",
     "accept": [
      "h(-2)=8",
      "h(-2) = 8"
     ],
     "explanation": "Substitute x = −2: (−2)² + 4 = 4 + 4 = 8. Double-check: (−2)²=4, 4+4=8.",
     "topic": "Function Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q28",
     "type": "written",
     "prompt": "What is the common difference of the arithmetic sequence 2, 6, 10, 14, …?",
     "answer": "4",
     "accept": [
      "+4",
      "d=4",
      "d = 4"
     ],
     "explanation": "Subtract consecutive terms: 6 − 2 = 4 and 10 − 6 = 4, so the common difference is 4.",
     "topic": "Arithmetic Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q29",
     "type": "written",
     "prompt": "An arithmetic sequence has a₁ = 3 and common difference d = 6. What is a₄, the 4th term?",
     "answer": "21",
     "accept": [
      "a4=21",
      "a4 = 21"
     ],
     "explanation": "Use aₙ = a₁ + (n − 1)d: a₄ = 3 + (4 − 1)(6) = 3 + 18 = 21. Double-check: 3×6=18, 18+3=21.",
     "topic": "Arithmetic Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q30",
     "type": "written",
     "prompt": "An arithmetic sequence has a₁ = 100 and common difference d = −8. What is a₇, the 7th term?",
     "answer": "52",
     "accept": [
      "a7=52",
      "a7 = 52"
     ],
     "explanation": "Use aₙ = a₁ + (n − 1)d: a₇ = 100 + (7 − 1)(−8) = 100 − 48 = 52. Double-check: 6×8=48, 100−48=52.",
     "topic": "Arithmetic Sequences",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u4-q31",
     "type": "written",
     "prompt": "A relation contains the points (2, 5), (4, 9), (6, 13), and (2, 8). Is this relation a function? Answer Yes or No.",
     "answer": "No",
     "accept": [
      "N",
      "n",
      "not a function",
      "No, not a function"
     ],
     "explanation": "The input 2 is paired with two different outputs, 5 and 8, so the relation is not a function.",
     "topic": "Relations and Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u4-q32",
     "type": "written",
     "prompt": "In the equation d = 60t, distance d depends on time t. Which variable, d or t, is the independent variable?",
     "answer": "t",
     "accept": [
      "time",
      "time t",
      "t (time)",
      "t time"
     ],
     "explanation": "The independent variable is the input that is chosen freely; here time t is chosen and distance d depends on it.",
     "topic": "Independent and Dependent Variables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u4-q33",
     "type": "written",
     "prompt": "A mapping diagram shows the input 5 mapped to the output -1. Write this pairing as an ordered pair in the form (input, output).",
     "answer": "(5,-1)",
     "accept": [
      "(5, -1)",
      "(5, −1)",
      "(5,−1)",
      "5,-1",
      "5, -1",
      "( 5 , -1 )"
     ],
     "explanation": "An ordered pair lists the input first and the output second, so the pairing is written (5, -1).",
     "topic": "Mapping Diagrams and Tables",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "alg1-u5",
   "unit": 5,
   "title": "Linear Functions",
   "summary": "Learn to find and interpret slope as a rate of change, then write and graph linear equations in slope-intercept, point-slope, and standard form. You'll also compare parallel and perpendicular slopes and recognize direct variation, y = kx, as a special kind of linear relationship.",
   "topics": [
    "Slope & Rate of Change",
    "Intercepts",
    "Slope-Intercept Form",
    "Point-Slope Form",
    "Standard Form",
    "Parallel & Perpendicular Lines",
    "Direct Variation"
   ],
   "terms": [
    {
     "term": "Slope",
     "definition": "A measure of a line's steepness, found as the ratio of vertical change to horizontal change between two points.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Rate of Change",
     "definition": "How much one quantity changes compared to another; for a line, this value is constant and equals its steepness measure.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Slope formula",
     "definition": "m = (y₂ − y₁)/(x₂ − x₁)",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Positive slope",
     "definition": "Describes a line that rises from left to right, where y increases as x increases.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Negative slope",
     "definition": "Describes a line that falls from left to right, where y decreases as x increases.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Zero slope",
     "definition": "Describes a horizontal line, where y stays the same no matter how x changes.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Undefined slope",
     "definition": "Describes a vertical line, where x stays the same while y changes, making the steepness ratio's denominator 0.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Rise",
     "definition": "The vertical change between two points on a line, used as the numerator when computing steepness.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "Run",
     "definition": "The horizontal change between two points on a line, used as the denominator when computing steepness.",
     "topic": "Slope & Rate of Change"
    },
    {
     "term": "x-intercept",
     "definition": "The point where a line crosses the x-axis, where y = 0.",
     "topic": "Intercepts"
    },
    {
     "term": "y-intercept",
     "definition": "The point where a line crosses the y-axis, where x = 0.",
     "topic": "Intercepts"
    },
    {
     "term": "Coordinate plane",
     "definition": "A grid formed by a horizontal axis and a vertical axis, used to graph points and lines.",
     "topic": "Intercepts"
    },
    {
     "term": "Slope-intercept form",
     "definition": "A line's equation written as y = mx + b; m gives the steepness and b the y-axis crossing.",
     "topic": "Slope-Intercept Form"
    },
    {
     "term": "Linear function",
     "definition": "A function whose graph is a straight line and can be written as f(x) = mx + b.",
     "topic": "Slope-Intercept Form"
    },
    {
     "term": "Point-slope form",
     "definition": "The equation of a line written as y − y₁ = m(x − x₁), built from one known point and the steepness value.",
     "topic": "Point-Slope Form"
    },
    {
     "term": "Standard form",
     "definition": "The equation of a line written as Ax + By = C, where A, B, and C are integers and A ≥ 0.",
     "topic": "Standard Form"
    },
    {
     "term": "Parallel lines",
     "definition": "Lines in the same plane that never intersect; non-vertical ones have equal steepness values, and any two vertical lines are also this type.",
     "topic": "Parallel & Perpendicular Lines"
    },
    {
     "term": "Perpendicular lines",
     "definition": "Lines that intersect at a right angle; when neither line is vertical, their steepness values are negative reciprocals of each other.",
     "topic": "Parallel & Perpendicular Lines"
    },
    {
     "term": "Negative reciprocal",
     "definition": "A number found by flipping a fraction and switching its sign, used to find the steepness of a perpendicular line.",
     "topic": "Parallel & Perpendicular Lines"
    },
    {
     "term": "Direct variation",
     "definition": "A relationship between two variables written as y = kx, where k is a nonzero constant.",
     "topic": "Direct Variation"
    },
    {
     "term": "Constant of variation",
     "definition": "The value k in the equation y = kx, representing the fixed ratio between y and x.",
     "topic": "Direct Variation"
    },
    {
     "term": "Origin",
     "definition": "The point (0, 0) where the horizontal and vertical axes intersect on a coordinate plane.",
     "topic": "Direct Variation"
    }
   ],
   "questions": [
    {
     "id": "alg1-u5-q1",
     "type": "mc",
     "prompt": "What is the slope of the line through (2, 3) and (5, 9)?",
     "options": [
      "2",
      "1/2",
      "3",
      "−2"
     ],
     "answer": "2",
     "explanation": "m = (y₂ − y₁)/(x₂ − x₁) = (9 − 3)/(5 − 2) = 6/3 = 2. Check: from (2,3), moving up 6 and right 3 lands on (5,9), and 6/3 = 2. ✓",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q2",
     "type": "mc",
     "prompt": "What is the slope of the line through (−1, 4) and (3, −4)?",
     "options": [
      "−2",
      "2",
      "−8",
      "−1/2"
     ],
     "answer": "−2",
     "explanation": "m = (y₂ − y₁)/(x₂ − x₁) = (−4 − 4)/(3 − (−1)) = −8/4 = −2. Check: −8 ÷ 4 = −2. ✓",
     "topic": "Slope & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q3",
     "type": "mc",
     "prompt": "A line has a slope of 0. What does its graph look like?",
     "options": [
      "A horizontal line",
      "A vertical line",
      "A line rising left to right",
      "A line falling left to right"
     ],
     "answer": "A horizontal line",
     "explanation": "A slope of 0 means there is no vertical change (rise = 0) as x changes, so the line is perfectly flat — horizontal.",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q4",
     "type": "mc",
     "prompt": "A vertical line has a slope that is:",
     "options": [
      "Undefined",
      "Zero",
      "Positive",
      "Negative"
     ],
     "answer": "Undefined",
     "explanation": "On a vertical line, x never changes, so the slope formula's denominator (x₂ − x₁) equals 0, and division by 0 is undefined.",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q5",
     "type": "mc",
     "prompt": "What is the y-intercept of the line y = 3x − 7?",
     "options": [
      "−7",
      "7",
      "3",
      "−3"
     ],
     "answer": "−7",
     "explanation": "In y = mx + b form, b is the y-intercept. Here b = −7, so the line crosses the y-axis at (0, −7).",
     "topic": "Intercepts",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q6",
     "type": "mc",
     "prompt": "A line crosses the x-axis at (4, 0) and the y-axis at (0, −2). What is its slope?",
     "options": [
      "1/2",
      "2",
      "−1/2",
      "−2"
     ],
     "answer": "1/2",
     "explanation": "m = (0 − (−2))/(4 − 0) = 2/4 = 1/2. Check: rise 2 over run 4 simplifies to 1/2. ✓",
     "topic": "Intercepts",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q7",
     "type": "mc",
     "prompt": "In the equation y = −5x + 8, what is the slope?",
     "options": [
      "−5",
      "8",
      "5",
      "−8"
     ],
     "answer": "−5",
     "explanation": "The equation is in y = mx + b form, so the coefficient of x, −5, is the slope; 8 is the y-intercept, not the slope.",
     "topic": "Slope-Intercept Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q8",
     "type": "mc",
     "prompt": "Which equation represents a line with slope 3 and y-intercept −2?",
     "options": [
      "y = 3x − 2",
      "y = −2x + 3",
      "y = 3x + 2",
      "y = 2x − 3"
     ],
     "answer": "y = 3x − 2",
     "explanation": "Substituting m = 3 and b = −2 into y = mx + b gives y = 3x − 2.",
     "topic": "Slope-Intercept Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q9",
     "type": "mc",
     "prompt": "A gym charges a $20 sign-up fee plus $5 per visit. Which equation gives the total cost y for x visits?",
     "options": [
      "y = 5x + 20",
      "y = 20x + 5",
      "y = 5x − 20",
      "y = 20x − 5"
     ],
     "answer": "y = 5x + 20",
     "explanation": "The $5 per-visit charge is the rate of change (slope), and the $20 fee is paid once, so it is the y-intercept: y = 5x + 20.",
     "topic": "Slope-Intercept Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q10",
     "type": "mc",
     "prompt": "Which equation is written in point-slope form for a line through (3, −1) with slope 4?",
     "options": [
      "y + 1 = 4(x − 3)",
      "y − 1 = 4(x + 3)",
      "y − 3 = 4(x + 1)",
      "y + 3 = 4(x − 1)"
     ],
     "answer": "y + 1 = 4(x − 3)",
     "explanation": "Point-slope form is y − y₁ = m(x − x₁). Using (x₁, y₁) = (3, −1): y − (−1) = 4(x − 3), which simplifies to y + 1 = 4(x − 3).",
     "topic": "Point-Slope Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q11",
     "type": "mc",
     "prompt": "A line passes through (2, 5) and has slope −3. What is the y-intercept of this line?",
     "options": [
      "11",
      "−1",
      "5",
      "−6"
     ],
     "answer": "11",
     "explanation": "y − 5 = −3(x − 2) → y = −3x + 6 + 5 = −3x + 11, so b = 11. Check: at x = 2, y = −3(2) + 11 = −6 + 11 = 5. ✓",
     "topic": "Point-Slope Form",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u5-q12",
     "type": "mc",
     "prompt": "Which equation is written in standard form (Ax + By = C)?",
     "options": [
      "2x + 3y = 12",
      "y = 2x + 12",
      "y − 4 = 2(x − 1)",
      "y = 5x − 1"
     ],
     "answer": "2x + 3y = 12",
     "explanation": "Standard form places both variables on one side and a constant on the other, as Ax + By = C; the other options are in slope-intercept or point-slope form.",
     "topic": "Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q13",
     "type": "mc",
     "prompt": "Write 2x + 4y = 8 in slope-intercept form.",
     "options": [
      "y = −½x + 2",
      "y = ½x + 2",
      "y = −2x + 8",
      "y = 2x − 8"
     ],
     "answer": "y = −½x + 2",
     "explanation": "Solve for y: 4y = −2x + 8, then divide every term by 4 to get y = −½x + 2. Check: 2x + 4(−½x + 2) = 2x − 2x + 8 = 8. ✓",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q14",
     "type": "mc",
     "prompt": "What is the x-intercept of the line 3x + 2y = 12?",
     "options": [
      "4",
      "6",
      "−4",
      "2"
     ],
     "answer": "4",
     "explanation": "Set y = 0: 3x = 12, so x = 4. Check: 3(4) + 2(0) = 12. ✓ (6 is the y-intercept, found by setting x = 0 instead.)",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q15",
     "type": "mc",
     "prompt": "A line has slope 2/5. A line parallel to it has slope:",
     "options": [
      "2/5",
      "−2/5",
      "5/2",
      "−5/2"
     ],
     "answer": "2/5",
     "explanation": "Parallel lines always have equal slopes, so a line parallel to a slope of 2/5 also has slope 2/5.",
     "topic": "Parallel & Perpendicular Lines",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q16",
     "type": "mc",
     "prompt": "Line A has slope −3/4. A line perpendicular to Line A has slope:",
     "options": [
      "4/3",
      "−4/3",
      "3/4",
      "−3/4"
     ],
     "answer": "4/3",
     "explanation": "Perpendicular slopes are negative reciprocals. Flip −3/4 to get −4/3, then switch the sign to get 4/3. Check: (−3/4)·(4/3) = −1, confirming they are perpendicular. ✓",
     "topic": "Parallel & Perpendicular Lines",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q17",
     "type": "mc",
     "prompt": "Which equation represents direct variation?",
     "options": [
      "y = 4x",
      "y = 4x + 1",
      "y = 4/x",
      "x + y = 4"
     ],
     "answer": "y = 4x",
     "explanation": "Direct variation has the form y = kx with no added or subtracted constant and no division by a variable; y = 4x fits, with k = 4.",
     "topic": "Direct Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q18",
     "type": "mc",
     "prompt": "If y varies directly with x, and y = 15 when x = 3, what is the constant of variation k?",
     "options": [
      "5",
      "15",
      "3",
      "1/5"
     ],
     "answer": "5",
     "explanation": "In y = kx, solve for k: k = y/x = 15/3 = 5. Check: 5 × 3 = 15. ✓",
     "topic": "Direct Variation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q19",
     "type": "tf",
     "prompt": "The slope formula is m = (y₂ − y₁)/(x₂ − x₁).",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the standard formula for finding slope between two points (x₁, y₁) and (x₂, y₂).",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q20",
     "type": "tf",
     "prompt": "A line that falls from left to right has a positive slope.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "When a line falls from left to right, y decreases as x increases, so the slope is negative. Lines with a positive slope rise from left to right.",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q21",
     "type": "tf",
     "prompt": "The x-intercept of a line is the point where its graph crosses the x-axis.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "By definition, the x-intercept is the point where y = 0, which is exactly where the graph meets the x-axis.",
     "topic": "Intercepts",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q22",
     "type": "tf",
     "prompt": "In the equation y = mx + b, the value of b represents the slope of the line.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "In y = mx + b, m is the slope and b is the y-intercept, not the other way around.",
     "topic": "Slope-Intercept Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q23",
     "type": "tf",
     "prompt": "The standard form of a linear equation is written as y = mx + b.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "y = mx + b is slope-intercept form. Standard form is written as Ax + By = C.",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q24",
     "type": "tf",
     "prompt": "Two lines with the same slope but different y-intercepts are parallel.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Equal slopes mean the lines rise and run at the same rate, so with different y-intercepts they never meet — the definition of parallel lines.",
     "topic": "Parallel & Perpendicular Lines",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q25",
     "type": "written",
     "prompt": "Find the slope of the line through (1, 2) and (4, 11).",
     "answer": "3",
     "accept": [
      "3.0",
      "3/1",
      "m=3",
      "m = 3"
     ],
     "explanation": "m = (11 − 2)/(4 − 1) = 9/3 = 3. Check: 3 × 3 = 9. ✓",
     "topic": "Slope & Rate of Change",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u5-q26",
     "type": "written",
     "prompt": "A ramp rises 2 feet for every 8 feet of horizontal distance. What is the slope of the ramp?",
     "answer": "1/4",
     "accept": [
      "0.25",
      ".25",
      "2/8",
      "m=1/4",
      "m = 1/4",
      "m=0.25",
      "m = 0.25"
     ],
     "explanation": "Slope = rise/run = 2/8 = 1/4. Check: 1/4 = 0.25, and 2 ÷ 8 = 0.25. ✓",
     "topic": "Slope & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q27",
     "type": "written",
     "prompt": "What is the y-intercept of 2x + 3y = 18? Write your answer as an ordered pair.",
     "answer": "(0,6)",
     "accept": [
      "(0, 6)"
     ],
     "explanation": "Set x = 0: 3y = 18, so y = 6, giving the point (0, 6). Check: 2(0) + 3(6) = 18. ✓",
     "topic": "Intercepts",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q28",
     "type": "written",
     "prompt": "What is the x-intercept of 3x + y = 9? Write your answer as an ordered pair.",
     "answer": "(3,0)",
     "accept": [
      "(3, 0)"
     ],
     "explanation": "Set y = 0: 3x = 9, so x = 3, giving the point (3, 0). Check: 3(3) + 0 = 9. ✓",
     "topic": "Intercepts",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q29",
     "type": "written",
     "prompt": "What is the slope of any line parallel to 2x + y = 7?",
     "answer": "-2",
     "accept": [
      "−2",
      "-2.0",
      "-2/1",
      "m=-2",
      "m = -2"
     ],
     "explanation": "Solve for y: y = −2x + 7, so the slope is −2. Parallel lines have equal slopes, so any parallel line also has slope −2.",
     "topic": "Parallel & Perpendicular Lines",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q30",
     "type": "written",
     "prompt": "A line passes through (1, 3) and (3, 7). What is its y-intercept? Give the y-value.",
     "answer": "1",
     "accept": [
      "1.0",
      "b=1",
      "b = 1",
      "y=1",
      "y = 1"
     ],
     "explanation": "m = (7 − 3)/(3 − 1) = 4/2 = 2. Then y − 3 = 2(x − 1) → y = 2x − 2 + 3 = 2x + 1, so b = 1. Check: at x = 3, y = 2(3) + 1 = 7. ✓",
     "topic": "Point-Slope Form",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u5-q31",
     "type": "written",
     "prompt": "What is the slope of the line 5x + 2y = 20?",
     "answer": "-5/2",
     "accept": [
      "−5/2",
      "-2.5",
      "−2.5",
      "-2 1/2",
      "m=-5/2",
      "m = -5/2",
      "m=-2.5",
      "m = -2.5"
     ],
     "explanation": "Solve for y: 2y = −5x + 20, so y = −(5/2)x + 10 and the slope is −5/2 = −2.5. Check: the slope of Ax + By = C is −A/B = −5/2. ✓",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u5-q32",
     "type": "written",
     "prompt": "If y varies directly with x, and y = 12 when x = 4, what is y when x = 7?",
     "answer": "21",
     "accept": [
      "21.0",
      "y=21",
      "y = 21"
     ],
     "explanation": "k = y/x = 12/4 = 3, so y = 3x. When x = 7, y = 3 · 7 = 21. Check: 21/7 = 3 = k. ✓",
     "topic": "Direct Variation",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg1-u6",
   "unit": 6,
   "title": "Systems of Equations and Inequalities",
   "summary": "Learn what it means for an ordered pair to solve a system, then solve linear systems by graphing, substitution, and elimination — including systems with no solution or infinitely many. Extend these skills to systems of linear inequalities and real-world word problems.",
   "topics": [
    "Solutions of Systems",
    "Solving by Graphing",
    "Solving by Substitution",
    "Solving by Elimination",
    "Special Cases: No Solution or Infinite Solutions",
    "Systems of Linear Inequalities",
    "Word Problems"
   ],
   "terms": [
    {
     "term": "System of equations",
     "definition": "Two or more equations with the same variables that are considered together.",
     "topic": "Solutions of Systems"
    },
    {
     "term": "Solution of a system",
     "definition": "An ordered pair (or pairs) that makes every equation in a system true at the same time.",
     "topic": "Solutions of Systems"
    },
    {
     "term": "Ordered pair",
     "definition": "Two numbers written in order as (x, y), locating a point on the coordinate plane.",
     "topic": "Solutions of Systems"
    },
    {
     "term": "Consistent system",
     "definition": "A system of equations that has at least one solution.",
     "topic": "Special Cases: No Solution or Infinite Solutions"
    },
    {
     "term": "Inconsistent system",
     "definition": "A system of equations that has no solution because its lines never meet.",
     "topic": "Special Cases: No Solution or Infinite Solutions"
    },
    {
     "term": "Independent system",
     "definition": "A consistent system that has exactly one solution.",
     "topic": "Special Cases: No Solution or Infinite Solutions"
    },
    {
     "term": "Dependent system",
     "definition": "A system whose equations graph as the same line, giving infinitely many shared points.",
     "topic": "Special Cases: No Solution or Infinite Solutions"
    },
    {
     "term": "Coincident lines",
     "definition": "Graphs that lie exactly on top of each other, sharing every point.",
     "topic": "Special Cases: No Solution or Infinite Solutions"
    },
    {
     "term": "Point of intersection",
     "definition": "The location where two graphed lines cross; its coordinates satisfy both equations.",
     "topic": "Solving by Graphing"
    },
    {
     "term": "Graphing method",
     "definition": "A way of solving a system by drawing both equations and finding where the lines cross.",
     "topic": "Solving by Graphing"
    },
    {
     "term": "Slope-intercept form",
     "definition": "y = mx + b, where m is the line's steepness and b is where it crosses the y-axis.",
     "topic": "Solving by Graphing"
    },
    {
     "term": "Substitution method",
     "definition": "Solving a system by replacing one variable with an equivalent expression from the other equation.",
     "topic": "Solving by Substitution"
    },
    {
     "term": "Elimination method",
     "definition": "Solving a system by adding or subtracting the equations so that one variable cancels out.",
     "topic": "Solving by Elimination"
    },
    {
     "term": "Standard form",
     "definition": "A linear equation written as Ax + By = C, often convenient before using elimination.",
     "topic": "Solving by Elimination"
    },
    {
     "term": "Linear inequality in two variables",
     "definition": "A statement comparing a linear expression in x and y using <, >, ≤, or ≥.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Boundary line",
     "definition": "The line from an inequality's related equation that separates the plane into two regions.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Solid boundary line",
     "definition": "An unbroken edge drawn for ≤ or ≥; points on it are solutions.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Dashed boundary line",
     "definition": "A broken edge drawn for < or >; points on it are not solutions.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Test point",
     "definition": "An (x, y) pair not on the boundary, substituted to decide which side to shade.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Overlapping shaded region",
     "definition": "The part of the plane satisfying every inequality in a system at once.",
     "topic": "Systems of Linear Inequalities"
    },
    {
     "term": "Break-even point",
     "definition": "Where cost equals revenue, so profit is zero.",
     "topic": "Word Problems"
    }
   ],
   "questions": [
    {
     "id": "alg1-u6-q1",
     "type": "mc",
     "prompt": "Which ordered pair is a solution of the system y = x + 2 and y = 3x − 4?",
     "options": [
      "(3, 5)",
      "(5, 3)",
      "(2, 4)",
      "(1, 3)"
     ],
     "answer": "(3, 5)",
     "explanation": "Set the expressions equal: x + 2 = 3x − 4 → 2 + 4 = 3x − x → 6 = 2x → x = 3, so y = 3 + 2 = 5. Check: 3(3) − 4 = 5 ✓, so (3, 5) works.",
     "topic": "Solutions of Systems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q2",
     "type": "mc",
     "prompt": "To check whether an ordered pair is a solution of a system of two equations, what must be true?",
     "options": [
      "It must make both equations true",
      "It must make at least one equation true",
      "It must be the y-intercept of one line",
      "It must make the two equations equal to each other"
     ],
     "answer": "It must make both equations true",
     "explanation": "A solution of a system has to satisfy every equation in the system at the same time, not just one of them.",
     "topic": "Solutions of Systems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q3",
     "type": "written",
     "prompt": "What is the solution of the system x = 4 and y = −3, written as an ordered pair?",
     "answer": "(4,-3)",
     "accept": [
      "(4, -3)",
      "(4, −3)",
      "(4,−3)",
      "4,-3",
      "4, -3",
      "x=4, y=-3",
      "x=4,y=-3",
      "x = 4, y = -3"
     ],
     "explanation": "Each equation already gives one coordinate: x = 4 and y = −3. So the solution is the point (4, −3).",
     "topic": "Solutions of Systems",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q4",
     "type": "mc",
     "prompt": "When solving a system of two linear equations by graphing, the solution is found where...",
     "options": [
      "the two lines intersect",
      "the two lines have the same y-intercept",
      "one line crosses the x-axis",
      "the slopes of the lines are equal"
     ],
     "answer": "the two lines intersect",
     "explanation": "The intersection point is the only (x, y) pair that lies on both lines, so it satisfies both equations at once.",
     "topic": "Solving by Graphing",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q5",
     "type": "mc",
     "prompt": "A system is graphed and the two lines are parallel with different y-intercepts. How many solutions does the system have?",
     "options": [
      "0",
      "1",
      "2",
      "Infinitely many"
     ],
     "answer": "0",
     "explanation": "Parallel lines with different y-intercepts never cross, so there is no point that satisfies both equations.",
     "topic": "Solving by Graphing",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q6",
     "type": "written",
     "prompt": "The lines y = 2x − 1 and y = −x + 5 intersect at a point. What is the x-coordinate of that point?",
     "answer": "2",
     "accept": [
      "x=2",
      "x = 2"
     ],
     "explanation": "Set the equations equal: 2x − 1 = −x + 5 → 3x = 6 → x = 2. Check: y = 2(2) − 1 = 3 and y = −2 + 5 = 3, so both agree.",
     "topic": "Solving by Graphing",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q7",
     "type": "tf",
     "prompt": "True or False: If two lines in a system have the same slope, the system must have exactly one solution.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Same-slope lines are either parallel (no solution) or identical (infinitely many solutions) — never exactly one solution, since equal slopes mean the lines never cross at a single unique point.",
     "topic": "Solving by Graphing",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q8",
     "type": "mc",
     "prompt": "Solve the system using substitution: y = 2x + 1 and 3x + y = 11. What is the value of x?",
     "options": [
      "2",
      "3",
      "4",
      "5"
     ],
     "answer": "2",
     "explanation": "Substitute 2x + 1 for y: 3x + (2x + 1) = 11 → 5x + 1 = 11 → 5x = 10 → x = 2. Check: y = 2(2) + 1 = 5, and 3(2) + 5 = 11 ✓.",
     "topic": "Solving by Substitution",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q9",
     "type": "written",
     "prompt": "Using substitution, solve the system y = x + 3 and 2x + y = 9. What is the value of y?",
     "answer": "5",
     "accept": [
      "y=5",
      "y = 5"
     ],
     "explanation": "Substitute x + 3 for y: 2x + (x + 3) = 9 → 3x + 3 = 9 → 3x = 6 → x = 2. Then y = 2 + 3 = 5. Check: 2(2) + 5 = 9 ✓.",
     "topic": "Solving by Substitution",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q10",
     "type": "mc",
     "prompt": "Which is the best first step to solve this system by substitution?\nx + y = 7\ny = 2x − 5",
     "options": [
      "Substitute 2x − 5 for y in the first equation",
      "Substitute 7 for y in the second equation",
      "Substitute x + y for x in the second equation",
      "Substitute 2x for y in the first equation"
     ],
     "answer": "Substitute 2x − 5 for y in the first equation",
     "explanation": "The second equation already gives y in terms of x, so replacing y with 2x − 5 in x + y = 7 leaves one equation with one variable: x + 2x − 5 = 7.",
     "topic": "Solving by Substitution",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q11",
     "type": "mc",
     "prompt": "Solve the system by elimination: 2x + 3y = 12 and 2x − y = 4. What is the value of y?",
     "options": [
      "2",
      "4",
      "3",
      "6"
     ],
     "answer": "2",
     "explanation": "Subtract the second equation from the first: (2x + 3y) − (2x − y) = 12 − 4 → 4y = 8 → y = 2. Check: 2x − 2 = 4 → x = 3, and 2(3) + 3(2) = 12 ✓.",
     "topic": "Solving by Elimination",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q12",
     "type": "written",
     "prompt": "Solve the system by elimination: 3x + 2y = 16 and x − 2y = 0. What is the value of x?",
     "answer": "4",
     "accept": [
      "x=4",
      "x = 4"
     ],
     "explanation": "Add the equations: (3x + 2y) + (x − 2y) = 16 + 0 → 4x = 16 → x = 4. Then 4 − 2y = 0 → y = 2. Check: 3(4) + 2(2) = 12 + 4 = 16 ✓.",
     "topic": "Solving by Elimination",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q13",
     "type": "mc",
     "prompt": "To eliminate the y-variable in the system 4x + 2y = 10 and x − y = 1, which step works best?",
     "options": [
      "Multiply the second equation by 2, then add",
      "Multiply the second equation by 2, then subtract",
      "Multiply the first equation by 2, then add",
      "Subtract the second equation from the first as written"
     ],
     "answer": "Multiply the second equation by 2, then add",
     "explanation": "2(x − y = 1) gives 2x − 2y = 2. Adding it to 4x + 2y = 10 gives 6x = 12, because +2y and −2y cancel. Subtracting instead would give 2x + 4y = 8, which still has y.",
     "topic": "Solving by Elimination",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q14",
     "type": "tf",
     "prompt": "True or False: When using elimination, you can multiply an entire equation by a nonzero number without changing its solution set.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Multiplying both sides of an equation by the same nonzero number produces an equivalent equation with the exact same solutions, which is why the technique is valid for elimination.",
     "topic": "Solving by Elimination",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q15",
     "type": "mc",
     "prompt": "A system of two linear equations has no solution. What must be true about their graphs?",
     "options": [
      "The lines are parallel and distinct",
      "The lines intersect at one point",
      "The lines are the same line",
      "The lines are perpendicular"
     ],
     "answer": "The lines are parallel and distinct",
     "explanation": "Parallel lines have equal slopes but different y-intercepts, so they never touch, meaning the system has no solution.",
     "topic": "Special Cases: No Solution or Infinite Solutions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q16",
     "type": "mc",
     "prompt": "A system of two linear equations has infinitely many solutions. What must be true about the two equations?",
     "options": [
      "They represent the same line",
      "They have different slopes",
      "They have the same slope but different y-intercepts",
      "They intersect at exactly one point"
     ],
     "answer": "They represent the same line",
     "explanation": "If both equations describe identical lines, every point on the line satisfies both equations, giving infinitely many solutions.",
     "topic": "Special Cases: No Solution or Infinite Solutions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q17",
     "type": "written",
     "prompt": "How many solutions does this system have? y = 3x + 2 and y = 3x − 7",
     "answer": "0",
     "accept": [
      "no solution",
      "No solution",
      "no solutions",
      "none",
      "None",
      "zero",
      "0 solutions",
      "zero solutions"
     ],
     "explanation": "Both lines have slope 3 but different y-intercepts (2 and −7), so they are parallel and never intersect. The system has 0 solutions.",
     "topic": "Special Cases: No Solution or Infinite Solutions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q18",
     "type": "tf",
     "prompt": "True or False: A system where both equations graph as the exact same line has exactly one solution.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "When both equations produce the same line, every point on that line is a solution, so there are infinitely many solutions, not just one.",
     "topic": "Special Cases: No Solution or Infinite Solutions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q19",
     "type": "mc",
     "prompt": "Which system has infinitely many solutions?",
     "options": [
      "y = 2x + 1 and y = 2x − 1",
      "y = 2x + 1 and 2y = 4x + 2",
      "y = 2x + 1 and y = −2x + 1",
      "y = 2x + 1 and x + y = 5"
     ],
     "answer": "y = 2x + 1 and 2y = 4x + 2",
     "explanation": "Dividing 2y = 4x + 2 by 2 gives y = 2x + 1, the exact same equation as the first, so every point on the line is a shared solution.",
     "topic": "Special Cases: No Solution or Infinite Solutions",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q20",
     "type": "mc",
     "prompt": "When graphing the inequality y > 2x − 1, what type of boundary line is used?",
     "options": [
      "Dashed line",
      "Solid line",
      "Dotted curve",
      "No boundary line is needed"
     ],
     "answer": "Dashed line",
     "explanation": "Because the inequality is strict (>), points on the line itself are not solutions, so the boundary is drawn dashed.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q21",
     "type": "mc",
     "prompt": "When graphing the inequality y ≤ x + 3, what type of boundary line is used?",
     "options": [
      "Solid line",
      "Dashed line",
      "A curve",
      "Two parallel lines"
     ],
     "answer": "Solid line",
     "explanation": "Because the inequality includes equality (≤), points on the line are solutions, so the boundary is drawn as a solid line.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q22",
     "type": "mc",
     "prompt": "To decide which side of a boundary line to shade for an inequality, what should you do?",
     "options": [
      "Substitute a test point into the inequality",
      "Always shade above the line",
      "Always shade below the line",
      "Shade the side with the smaller x-intercept"
     ],
     "answer": "Substitute a test point into the inequality",
     "explanation": "Plug a point that is not on the line into the original inequality. If the result is true, shade that point's side; if it is false, shade the other side.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q23",
     "type": "written",
     "prompt": "Is the point (0, 0) a solution of the inequality y > x + 1? Answer Yes or No.",
     "answer": "No",
     "accept": [
      "false",
      "not a solution"
     ],
     "explanation": "Substitute (0, 0): 0 > 0 + 1 becomes 0 > 1, which is false, so (0, 0) is not a solution.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q24",
     "type": "tf",
     "prompt": "True or False: The solution region of a system of inequalities is where the shaded regions of all the inequalities overlap.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A point must satisfy every inequality in the system at once, so it must lie in the shaded region of each one, i.e., in the overlap.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q25",
     "type": "mc",
     "prompt": "Which point lies in the solution region of the system y ≤ x + 2 and y ≥ −x?",
     "options": [
      "(0, 0)",
      "(3, −5)",
      "(−4, 1)",
      "(5, −6)"
     ],
     "answer": "(0, 0)",
     "explanation": "At (0, 0): 0 ≤ 0 + 2 is true, and 0 ≥ −0 is true, so both inequalities hold. The other points each fail at least one inequality when checked.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q26",
     "type": "mc",
     "prompt": "Which ordered pair satisfies both y < x and y > −2?",
     "options": [
      "(3, 1)",
      "(1, 3)",
      "(−3, −1)",
      "(0, −3)"
     ],
     "answer": "(3, 1)",
     "explanation": "At (3, 1): 1 < 3 is true and 1 > −2 is true, so both hold. For example, (0, −3) fails since −3 > −2 is false.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q27",
     "type": "tf",
     "prompt": "True or False: A point that lies exactly on a dashed boundary line is included in the inequality's solution set.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A dashed line represents a strict inequality (< or >), so points exactly on the line are excluded from the solution set.",
     "topic": "Systems of Linear Inequalities",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u6-q28",
     "type": "mc",
     "prompt": "Two numbers have a sum of 20 and a difference of 4. What are the two numbers?",
     "options": [
      "12 and 8",
      "14 and 6",
      "10 and 10",
      "16 and 4"
     ],
     "answer": "12 and 8",
     "explanation": "Let x + y = 20 and x − y = 4. Adding gives 2x = 24, so x = 12, and y = 20 − 12 = 8. Check: 12 − 8 = 4 ✓.",
     "topic": "Word Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q29",
     "type": "written",
     "prompt": "A theater charges $8 for adult tickets and $5 for child tickets. One night, 200 tickets were sold for a total of $1300. How many adult tickets were sold?",
     "answer": "100",
     "accept": [
      "100 tickets",
      "100 adult tickets",
      "100 adults",
      "a=100",
      "a = 100"
     ],
     "explanation": "Let a + c = 200 and 8a + 5c = 1300. Substitute c = 200 − a: 8a + 1000 − 5a = 1300 → 3a = 300 → a = 100. Check: 8(100) + 5(100) = 800 + 500 = 1300 ✓.",
     "topic": "Word Problems",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q30",
     "type": "mc",
     "prompt": "A company's cost to produce x items is C = 5x + 200, and its revenue is R = 15x. How many items must be sold to break even?",
     "options": [
      "20",
      "15",
      "40",
      "10"
     ],
     "answer": "20",
     "explanation": "Break-even occurs where cost equals revenue: 5x + 200 = 15x → 200 = 10x → x = 20. Check: C = 5(20) + 200 = 300 and R = 15(20) = 300 ✓.",
     "topic": "Word Problems",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u6-q31",
     "type": "tf",
     "prompt": "True or False: In a system of equations word problem, the two equations typically represent two different relationships between the same variables.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Word problems usually give two separate pieces of information (like a total quantity and a total cost), and each becomes its own equation using the same variables.",
     "topic": "Word Problems",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u6-q32",
     "type": "written",
     "prompt": "For the system 3x + y = 9 and x − y = 3, what is the value of y?",
     "answer": "0",
     "accept": [
      "y=0",
      "y = 0"
     ],
     "explanation": "Add the equations: 4x = 12 → x = 3. Then 3 − y = 3 → y = 0. Check: 3(3) + 0 = 9 ✓.",
     "topic": "Solutions of Systems",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "alg1-u7",
   "unit": 7,
   "title": "Exponents and Exponential Functions",
   "summary": "Master the laws of exponents — product, quotient, and power rules, plus zero and negative exponents — and use them to read and write numbers in scientific notation. Then model real growth and decay with y = a·bˣ, connecting growth/decay factors and rates to geometric sequences and their common ratio.",
   "topics": [
    "Exponent Rules",
    "Zero and Negative Exponents",
    "Scientific Notation",
    "Exponential Functions",
    "Growth and Decay Rate",
    "Geometric Sequences"
   ],
   "terms": [
    {
     "term": "Product Rule",
     "definition": "aᵐ · aⁿ = aᵐ⁺ⁿ; multiply powers with the same base by adding their exponents.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Quotient Rule",
     "definition": "aᵐ ÷ aⁿ = aᵐ⁻ⁿ; divide powers with the same base by subtracting exponents.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Power Rule",
     "definition": "(aᵐ)ⁿ = aᵐⁿ; raise a power to a power by multiplying the exponents.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Power of a Product Rule",
     "definition": "(ab)ⁿ = aⁿbⁿ; apply an outer exponent to each factor inside the parentheses.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Power of a Quotient Rule",
     "definition": "(a/b)ⁿ = aⁿ/bⁿ; apply an outer exponent to both the numerator and denominator.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Base",
     "definition": "the repeated factor in a power, such as the 5 in 5³.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Exponent",
     "definition": "the small raised number showing how many times a factor repeats, such as the 3 in 5³.",
     "topic": "Exponent Rules"
    },
    {
     "term": "Zero Exponent Rule",
     "definition": "a⁰ = 1 for any nonzero value of a.",
     "topic": "Zero and Negative Exponents"
    },
    {
     "term": "Negative Exponent Rule",
     "definition": "a⁻ⁿ = 1/aⁿ for any nonzero value of a.",
     "topic": "Zero and Negative Exponents"
    },
    {
     "term": "Scientific Notation",
     "definition": "a way to write a number as a × 10ⁿ, where 1 ≤ a < 10 and n is an integer.",
     "topic": "Scientific Notation"
    },
    {
     "term": "Standard Form",
     "definition": "a number written out fully in ordinary place-value digits rather than using powers of ten.",
     "topic": "Scientific Notation"
    },
    {
     "term": "Exponential Function",
     "definition": "a function of the form y = a·bˣ, where a ≠ 0, b > 0, and b ≠ 1.",
     "topic": "Exponential Functions"
    },
    {
     "term": "Initial Value",
     "definition": "the starting amount a in y = a·bˣ, the output when x = 0.",
     "topic": "Exponential Functions"
    },
    {
     "term": "Horizontal Asymptote",
     "definition": "a flat line y = k that a graph gets closer and closer to as x moves far to the left or right; for y = a·bˣ it is the line y = 0, which the graph never reaches.",
     "topic": "Exponential Functions"
    },
    {
     "term": "Growth Factor",
     "definition": "the base b in y = a·bˣ when b > 1, multiplying the output each step.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Decay Factor",
     "definition": "the base b in y = a·bˣ when 0 < b < 1, multiplying the output each step.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Growth Rate",
     "definition": "the percent r a quantity increases each period, related to the base by b = 1 + r.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Decay Rate",
     "definition": "the percent r a quantity decreases each period, related to the base by b = 1 − r.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Exponential Growth",
     "definition": "a pattern in which a quantity is repeatedly multiplied by a factor greater than 1.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Exponential Decay",
     "definition": "a pattern in which a quantity is repeatedly multiplied by a factor between 0 and 1.",
     "topic": "Growth and Decay Rate"
    },
    {
     "term": "Geometric Sequence",
     "definition": "a list of numbers in which each term is found by multiplying the previous term by a fixed number.",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Common Ratio",
     "definition": "the fixed number multiplied by each term of a geometric sequence to get the next term.",
     "topic": "Geometric Sequences"
    },
    {
     "term": "Geometric Sequence Formula",
     "definition": "aₙ = a₁ · r ⁿ⁻¹; gives any term from the first term and the fixed multiplier.",
     "topic": "Geometric Sequences"
    }
   ],
   "questions": [
    {
     "id": "alg1-u7-q1",
     "type": "mc",
     "prompt": "Simplify: x⁴ · x⁵",
     "options": [
      "x⁹",
      "x²⁰",
      "x¹",
      "2x⁹"
     ],
     "answer": "x⁹",
     "explanation": "The product rule says same-base powers multiply by adding exponents: x⁴ · x⁵ = x⁴⁺⁵ = x⁹.",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q2",
     "type": "mc",
     "prompt": "Simplify: y⁸ ÷ y³",
     "options": [
      "y⁵",
      "y¹¹",
      "y²⁴",
      "y³"
     ],
     "answer": "y⁵",
     "explanation": "The quotient rule says same-base powers divide by subtracting exponents: y⁸ ÷ y³ = y⁸⁻³ = y⁵.",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q3",
     "type": "mc",
     "prompt": "Simplify: (x³)⁴",
     "options": [
      "x¹²",
      "x⁷",
      "x⁶⁴",
      "3x¹²"
     ],
     "answer": "x¹²",
     "explanation": "The power rule says raise a power to a power by multiplying exponents: (x³)⁴ = x³·⁴ = x¹².",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q4",
     "type": "tf",
     "prompt": "True or False: x² · x⁶ = x¹².",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The product rule adds exponents, not multiplies them: x² · x⁶ = x²⁺⁶ = x⁸, not x¹².",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q5",
     "type": "tf",
     "prompt": "True or False: m¹⁰ ÷ m² = m⁸.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Dividing same-base powers subtracts exponents: m¹⁰ ÷ m² = m¹⁰⁻² = m⁸. It is not m⁵, because you subtract the exponents rather than divide them.",
     "topic": "Exponent Rules",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q6",
     "type": "mc",
     "prompt": "Simplify: (2x³)²",
     "options": [
      "4x⁶",
      "2x⁶",
      "4x⁵",
      "2x⁵"
     ],
     "answer": "4x⁶",
     "explanation": "Square each factor: 2² = 4 and (x³)² = x⁶, so (2x³)² = 4x⁶.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q7",
     "type": "mc",
     "prompt": "Simplify: (x/y²)³",
     "options": [
      "x³/y⁶",
      "x³/y⁵",
      "x⁶/y⁶",
      "x/y⁵"
     ],
     "answer": "x³/y⁶",
     "explanation": "Cube the numerator and denominator separately: x³ and (y²)³ = y⁶, giving x³/y⁶.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q8",
     "type": "mc",
     "prompt": "Simplify: (a²b)³",
     "options": [
      "a⁶b³",
      "a⁵b³",
      "a⁶b",
      "a⁵b"
     ],
     "answer": "a⁶b³",
     "explanation": "Apply the exponent to each factor: (a²)³ = a⁶ and b³ = b³, so (a²b)³ = a⁶b³.",
     "topic": "Exponent Rules",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q9",
     "type": "mc",
     "prompt": "Which expression is equivalent to 3⁻²?",
     "options": [
      "1/9",
      "-9",
      "-1/9",
      "9"
     ],
     "answer": "1/9",
     "explanation": "A negative exponent means reciprocate: 3⁻² = 1/3² = 1/9.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q10",
     "type": "mc",
     "prompt": "Simplify: m⁻³",
     "options": [
      "1/m³",
      "-m³",
      "m³",
      "-1/m³"
     ],
     "answer": "1/m³",
     "explanation": "A negative exponent moves the base to the denominator: m⁻³ = 1/m³.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q11",
     "type": "tf",
     "prompt": "True or False: Any nonzero number raised to the zero power equals 0.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "By the zero exponent rule, a⁰ = 1 for any nonzero a, not 0.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q12",
     "type": "tf",
     "prompt": "True or False: 2⁻³ equals 1/8.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "2⁻³ = 1/2³ = 1/8, since 2³ = 8, so the statement is correct.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q13",
     "type": "written",
     "prompt": "Evaluate: 7⁰",
     "answer": "1",
     "accept": [
      "1.0"
     ],
     "explanation": "By the zero exponent rule, any nonzero number to the zero power equals 1.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q14",
     "type": "written",
     "prompt": "Evaluate 2⁻⁴ and write it as a fraction or decimal.",
     "answer": "1/16",
     "accept": [
      "1 / 16",
      "0.0625",
      ".0625"
     ],
     "explanation": "2⁻⁴ = 1/2⁴ = 1/16, since 2⁴ = 2·2·2·2 = 16; as a decimal, 1 ÷ 16 = 0.0625.",
     "topic": "Zero and Negative Exponents",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q15",
     "type": "written",
     "prompt": "Simplify 5³ · 5⁻¹ and give the resulting value.",
     "answer": "25",
     "accept": [
      "25.0"
     ],
     "explanation": "Add the exponents: 5³ · 5⁻¹ = 5³⁺⁽⁻¹⁾ = 5² = 25; check: 125 × 1/5 = 25.",
     "topic": "Exponent Rules",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u7-q16",
     "type": "mc",
     "prompt": "Which of these is correctly written in scientific notation?",
     "options": [
      "3.4 × 10⁵",
      "34 × 10⁴",
      "0.34 × 10⁶",
      "3.4 × 5⁵"
     ],
     "answer": "3.4 × 10⁵",
     "explanation": "Scientific notation requires a first factor a with 1 ≤ a < 10 times a power of 10; only 3.4 × 10⁵ meets both conditions.",
     "topic": "Scientific Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q17",
     "type": "mc",
     "prompt": "Write 452,000 in scientific notation.",
     "options": [
      "4.52 × 10⁵",
      "4.52 × 10⁴",
      "45.2 × 10⁴",
      "4.52 × 10⁶"
     ],
     "answer": "4.52 × 10⁵",
     "explanation": "Move the decimal point 5 places left to get 4.52, so 452,000 = 4.52 × 10⁵; check: 4.52 × 100,000 = 452,000.",
     "topic": "Scientific Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q18",
     "type": "mc",
     "prompt": "Write 0.000078 in scientific notation.",
     "options": [
      "7.8 × 10⁻⁵",
      "7.8 × 10⁻⁴",
      "7.8 × 10⁵",
      "78 × 10⁻⁶"
     ],
     "answer": "7.8 × 10⁻⁵",
     "explanation": "Move the decimal point 5 places right to get 7.8, so 0.000078 = 7.8 × 10⁻⁵; check: 7.8 × 0.00001 = 0.000078.",
     "topic": "Scientific Notation",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u7-q19",
     "type": "tf",
     "prompt": "True or False: A positive number in scientific notation has the form a × 10ⁿ, where 1 ≤ a < 10 and n is an integer.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the definition of scientific notation: the first factor must be at least 1 and less than 10, and it is multiplied by an integer power of 10, as in 4.52 × 10⁵.",
     "topic": "Scientific Notation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q20",
     "type": "written",
     "prompt": "Write 6.02 × 10³ in standard form.",
     "answer": "6020",
     "accept": [
      "6,020",
      "6020.0"
     ],
     "explanation": "Move the decimal point 3 places right: 6.02 × 1,000 = 6,020.",
     "topic": "Scientific Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q21",
     "type": "written",
     "prompt": "Write 4 × 10² in standard form.",
     "answer": "400",
     "accept": [
      "400.0"
     ],
     "explanation": "Move the decimal point 2 places right: 4 × 100 = 400.",
     "topic": "Scientific Notation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q22",
     "type": "mc",
     "prompt": "A car's value is modeled by V = 22000(0.90)ᵗ. What does 22000 represent?",
     "options": [
      "The initial value of the car",
      "The decay factor",
      "The annual decay rate",
      "The common ratio of a geometric sequence"
     ],
     "answer": "The initial value of the car",
     "explanation": "In y = a·bˣ, the factor a is the starting value when t = 0, so 22000 is the car's initial value.",
     "topic": "Exponential Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q23",
     "type": "mc",
     "prompt": "Which equation represents exponential decay?",
     "options": [
      "y = 50(0.75)ˣ",
      "y = 50(1.75)ˣ",
      "y = 0.75(50)ˣ",
      "y = 50(1)ˣ"
     ],
     "answer": "y = 50(0.75)ˣ",
     "explanation": "Exponential decay requires a base b between 0 and 1; only 0.75 falls in that range among the bases shown.",
     "topic": "Exponential Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q24",
     "type": "mc",
     "prompt": "In y = a·bˣ, which value of b makes the function a growth function?",
     "options": [
      "b = 1.5",
      "b = 0.5",
      "b = 1",
      "b = -1.5"
     ],
     "answer": "b = 1.5",
     "explanation": "Growth requires the base to be greater than 1; only 1.5 satisfies b > 1.",
     "topic": "Exponential Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q25",
     "type": "tf",
     "prompt": "True or False: In the exponential function y = a·bˣ, if b > 1 the function represents decay.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A base greater than 1 causes the output to increase, which is growth, not decay.",
     "topic": "Exponential Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q26",
     "type": "mc",
     "prompt": "A population is modeled by P = 800(1.05)ᵗ. What does the 1.05 represent?",
     "options": [
      "A growth factor for a 5% increase per period",
      "A decay factor for a 5% decrease per period",
      "A growth factor for a 105% increase per period",
      "The population at the start, in hundreds"
     ],
     "answer": "A growth factor for a 5% increase per period",
     "explanation": "Since b = 1 + r, 1.05 = 1 + 0.05, which is a 5% growth rate each period. Multiplying by 1.05 keeps 100% and adds 5%, so it is not a 105% increase.",
     "topic": "Growth and Decay Rate",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q27",
     "type": "written",
     "prompt": "A machine's value is modeled by V = 18000(0.88)ᵗ. What is the annual decay rate, as a percent?",
     "answer": "12%",
     "accept": [
      "12",
      "12 %",
      "12 percent",
      "0.12",
      ".12"
     ],
     "explanation": "Since b = 1 − r, 0.88 = 1 − r gives r = 1 − 0.88 = 0.12, which is a 12% decay rate each year.",
     "topic": "Growth and Decay Rate",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u7-q28",
     "type": "mc",
     "prompt": "What is the common ratio of the geometric sequence 100, 20, 4, 0.8, …?",
     "options": [
      "0.2",
      "5",
      "-20",
      "0.8"
     ],
     "answer": "0.2",
     "explanation": "Divide any term by the one before it: 20/100 = 0.2 and 4/20 = 0.2, confirming a common ratio of 0.2.",
     "topic": "Geometric Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q29",
     "type": "mc",
     "prompt": "Which sequence is geometric?",
     "options": [
      "3, 6, 12, 24",
      "3, 6, 9, 12",
      "3, 5, 8, 12",
      "3, 6, 10, 15"
     ],
     "answer": "3, 6, 12, 24",
     "explanation": "In 3, 6, 12, 24 each term is 2 times the one before (6/3 = 12/6 = 24/12 = 2). The other sequences add amounts instead of multiplying by a constant ratio; for example, 6/3 = 2 but 9/6 = 1.5.",
     "topic": "Geometric Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q30",
     "type": "tf",
     "prompt": "True or False: In a geometric sequence, each term is found by multiplying the previous term by a constant ratio.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the definition of a geometric sequence, distinguishing it from an arithmetic sequence, which adds a constant difference.",
     "topic": "Geometric Sequences",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u7-q31",
     "type": "written",
     "prompt": "A geometric sequence begins 3, 12, 48, 192. What is the common ratio?",
     "answer": "4",
     "accept": [
      "4.0"
     ],
     "explanation": "Divide consecutive terms: 12/3 = 4 and 48/12 = 4, confirming the common ratio is 4.",
     "topic": "Geometric Sequences",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u7-q32",
     "type": "written",
     "prompt": "The first term of a geometric sequence is 5 and the common ratio is 2. Find the 4th term.",
     "answer": "40",
     "accept": [
      "40.0"
     ],
     "explanation": "Using aₙ = a₁·rⁿ⁻¹: a₄ = 5 · 2³ = 5 · 8 = 40.",
     "topic": "Geometric Sequences",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u8",
   "unit": 8,
   "title": "Polynomials",
   "summary": "Learn to name and classify polynomials by their number of terms and find their degree and standard form. Practice adding, subtracting, and multiplying polynomials — including FOIL, the box method, and special product patterns like (a ± b)² and (a + b)(a − b).",
   "topics": [
    "Naming & Classifying Polynomials",
    "Degree & Standard Form",
    "Adding & Subtracting Polynomials",
    "Multiplying Polynomials",
    "Special Products"
   ],
   "terms": [
    {
     "term": "Polynomial",
     "definition": "An expression made of one or more monomials, called terms, combined by addition or subtraction.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Monomial",
     "definition": "A single term: a number, a variable, or a product of them with whole-number exponents.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Binomial",
     "definition": "A polynomial with exactly two unlike terms.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Trinomial",
     "definition": "A polynomial with exactly three unlike terms.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Term",
     "definition": "A number, variable, or product of numbers and variables; each is separated from the next by + or −.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Constant",
     "definition": "A term in an expression that has no variable factor.",
     "topic": "Naming & Classifying Polynomials"
    },
    {
     "term": "Coefficient",
     "definition": "The numerical factor that multiplies the variable part of a term.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Degree of a term",
     "definition": "The sum of the exponents of all the variables in that term.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Degree of a polynomial",
     "definition": "The greatest of the degrees among all the terms in the expression.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Standard form (polynomial)",
     "definition": "Writing the terms of an expression in order from highest degree to lowest degree.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Leading term",
     "definition": "The term with the greatest degree in an expression written in standard form.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Leading coefficient",
     "definition": "The numerical factor of the term with the greatest degree, once the expression is written in standard form.",
     "topic": "Degree & Standard Form"
    },
    {
     "term": "Like terms",
     "definition": "Terms whose variable parts, including exponents, are exactly the same.",
     "topic": "Adding & Subtracting Polynomials"
    },
    {
     "term": "Combining like terms",
     "definition": "Adding or subtracting the coefficients of terms that share the same variable part.",
     "topic": "Adding & Subtracting Polynomials"
    },
    {
     "term": "Opposite of a polynomial",
     "definition": "The result of changing the sign of every term, used when subtracting one expression from another.",
     "topic": "Adding & Subtracting Polynomials"
    },
    {
     "term": "Distributive property",
     "definition": "The rule a(b + c) = ab + ac, used to multiply a term by every term inside parentheses.",
     "topic": "Multiplying Polynomials"
    },
    {
     "term": "FOIL method",
     "definition": "A memory device for multiplying two binomials: multiply the First, Outer, Inner, and Last pairs of terms.",
     "topic": "Multiplying Polynomials"
    },
    {
     "term": "Box method (area model)",
     "definition": "A grid that lines up each term of two factors along its sides so every pairwise product can be filled in and added.",
     "topic": "Multiplying Polynomials"
    },
    {
     "term": "Perfect square trinomial",
     "definition": "The three-term result of squaring a binomial: a² + 2ab + b² or a² − 2ab + b².",
     "topic": "Special Products"
    },
    {
     "term": "Difference of squares",
     "definition": "The pattern (a + b)(a − b) = a² − b², a product with no middle term.",
     "topic": "Special Products"
    },
    {
     "term": "Middle term",
     "definition": "In an expanded binomial square, the term containing the product 2ab, found between the two squared terms.",
     "topic": "Special Products"
    }
   ],
   "questions": [
    {
     "id": "alg1-u8-q1",
     "type": "mc",
     "prompt": "How many terms does the expression 5x² + 3x − 7 have, and what is it called?",
     "options": [
      "Two terms — binomial",
      "Three terms — trinomial",
      "Three terms — polynomial only",
      "Four terms — polynomial"
     ],
     "answer": "Three terms — trinomial",
     "explanation": "It has three unlike terms: 5x², 3x, and −7, so it is a trinomial.",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q2",
     "type": "mc",
     "prompt": "Which of these expressions is a monomial?",
     "options": [
      "7x³",
      "x + 5",
      "3x² − 1",
      "2x² + x − 4"
     ],
     "answer": "7x³",
     "explanation": "A monomial is a single term with no addition or subtraction; 7x³ is one term.",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q3",
     "type": "mc",
     "prompt": "Classify 8x⁴ − 2x by its number of terms.",
     "options": [
      "Monomial",
      "Binomial",
      "Trinomial",
      "Cannot be classified"
     ],
     "answer": "Binomial",
     "explanation": "It has two unlike terms, 8x⁴ and −2x, so it is a binomial.",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q4",
     "type": "mc",
     "prompt": "What is the degree of the term 4x²y³?",
     "options": [
      "2",
      "3",
      "5",
      "6"
     ],
     "answer": "5",
     "explanation": "The degree of a term is the sum of its exponents: 2 + 3 = 5.",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q5",
     "type": "mc",
     "prompt": "What is the degree of the polynomial 3x⁴ − 5x² + 2x − 9?",
     "options": [
      "2",
      "3",
      "4",
      "9"
     ],
     "answer": "4",
     "explanation": "The degree of a polynomial equals the greatest degree of any of its terms, and the highest exponent here is 4.",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q6",
     "type": "mc",
     "prompt": "What is the leading coefficient of −6x³ + 2x² − x + 5 (already written in standard form)?",
     "options": [
      "−6",
      "2",
      "−1",
      "5"
     ],
     "answer": "−6",
     "explanation": "The highest-degree term is −6x³, so its coefficient, −6, is the leading coefficient.",
     "topic": "Degree & Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q7",
     "type": "mc",
     "prompt": "Which of these is written in standard form?",
     "options": [
      "5x³ − 2x + 4",
      "2x − 5x³ + 4",
      "4 + 2x − 5x³",
      "5x³ + 4 − 2x"
     ],
     "answer": "5x³ − 2x + 4",
     "explanation": "Standard form lists terms from highest degree to lowest: degree 3, then degree 1, then degree 0 (the constant).",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q8",
     "type": "mc",
     "prompt": "Simplify: (3x² + 5x) + (2x² − 3x)",
     "options": [
      "5x² + 2x",
      "5x² + 8x",
      "x² + 2x",
      "5x² − 2x"
     ],
     "answer": "5x² + 2x",
     "explanation": "Add like terms: 3x² + 2x² = 5x², and 5x + (−3x) = 2x.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q9",
     "type": "mc",
     "prompt": "Simplify: (4x² − 3x + 7) − (2x² + x − 5)",
     "options": [
      "2x² − 4x + 12",
      "2x² − 2x + 2",
      "6x² − 4x + 2",
      "2x² − 4x + 2"
     ],
     "answer": "2x² − 4x + 12",
     "explanation": "Distribute the subtraction (flip the signs of the second polynomial), then combine like terms: 4x² − 2x² = 2x², −3x − x = −4x, and 7 − (−5) = 12.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q10",
     "type": "mc",
     "prompt": "Simplify: (5x³ − 2x² + x) − (3x³ + x² − 4x) + (x² − x + 2)",
     "options": [
      "2x³ − 2x² + 4x + 2",
      "2x³ − 3x² + 5x + 2",
      "8x³ − 2x² + 4x + 2",
      "2x³ − 2x² + 3x + 2"
     ],
     "answer": "2x³ − 2x² + 4x + 2",
     "explanation": "Combine like terms in stages: x³ terms give 5 − 3 = 2x³, x² terms give −2 − 1 + 1 = −2x², x terms give 1 + 4 − 1 = 4x, and the constant is 2, giving 2x³ − 2x² + 4x + 2.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u8-q11",
     "type": "mc",
     "prompt": "Multiply using the distributive property: 3x(2x² − 5x + 4)",
     "options": [
      "6x³ − 15x² + 12x",
      "6x² − 15x + 12",
      "6x³ − 15x² + 4",
      "5x³ − 15x² + 12x"
     ],
     "answer": "6x³ − 15x² + 12x",
     "explanation": "Distribute 3x to each term: 3x·2x² = 6x³, 3x·(−5x) = −15x², and 3x·4 = 12x.",
     "topic": "Multiplying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q12",
     "type": "mc",
     "prompt": "Use FOIL to multiply (x + 4)(x − 3)",
     "options": [
      "x² + x − 12",
      "x² − 7x − 12",
      "x² + 7x − 12",
      "x² − x − 12"
     ],
     "answer": "x² + x − 12",
     "explanation": "FOIL gives x·x = x², x·(−3) = −3x, 4·x = 4x, and 4·(−3) = −12; combining −3x + 4x = x gives x² + x − 12.",
     "topic": "Multiplying Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q13",
     "type": "mc",
     "prompt": "Multiply (2x − 1)(3x + 5)",
     "options": [
      "6x² + 7x − 5",
      "6x² + 13x − 5",
      "6x² − 7x − 5",
      "5x² + 7x − 5"
     ],
     "answer": "6x² + 7x − 5",
     "explanation": "FOIL: 2x·3x = 6x², 2x·5 = 10x, −1·3x = −3x, −1·5 = −5; combining 10x − 3x = 7x gives 6x² + 7x − 5.",
     "topic": "Multiplying Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q14",
     "type": "mc",
     "prompt": "Multiply (x + 2)(x² − 3x + 5)",
     "options": [
      "x³ − x² − x + 10",
      "x³ + x² − x + 10",
      "x³ − x² + x + 10",
      "x³ − 5x² − x + 10"
     ],
     "answer": "x³ − x² − x + 10",
     "explanation": "Distribute each term: x(x² − 3x + 5) = x³ − 3x² + 5x, and 2(x² − 3x + 5) = 2x² − 6x + 10; combining gives x³ − x² − x + 10.",
     "topic": "Multiplying Polynomials",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u8-q15",
     "type": "mc",
     "prompt": "Expand (x + 6)²",
     "options": [
      "x² + 12x + 36",
      "x² + 36",
      "x² + 6x + 36",
      "x² + 12x + 12"
     ],
     "answer": "x² + 12x + 36",
     "explanation": "(a + b)² = a² + 2ab + b²: x² + 2(x)(6) + 6² = x² + 12x + 36.",
     "topic": "Special Products",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q16",
     "type": "mc",
     "prompt": "Expand (3x − 2)²",
     "options": [
      "9x² − 12x + 4",
      "9x² − 4",
      "9x² − 6x + 4",
      "3x² − 12x + 4"
     ],
     "answer": "9x² − 12x + 4",
     "explanation": "(a − b)² = a² − 2ab + b²: (3x)² − 2(3x)(2) + 2² = 9x² − 12x + 4.",
     "topic": "Special Products",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q17",
     "type": "mc",
     "prompt": "Multiply (x + 7)(x − 7)",
     "options": [
      "x² − 49",
      "x² + 49",
      "x² − 14x − 49",
      "x² − 14x + 49"
     ],
     "answer": "x² − 49",
     "explanation": "(a + b)(a − b) = a² − b²: x² − 7² = x² − 49, with no middle term because the outer and inner products cancel.",
     "topic": "Special Products",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q18",
     "type": "tf",
     "prompt": "A trinomial has exactly three terms.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Trinomial literally means three terms (\"tri-\" means three).",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q19",
     "type": "tf",
     "prompt": "The expression 3x + 2x is a binomial.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "3x and 2x are like terms that combine to 5x, which is a single term, so the expression is a monomial, not a binomial.",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q20",
     "type": "tf",
     "prompt": "The degree of the term −7x⁵ is 7.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The degree of a term is the exponent on its variable, not the size of the coefficient; here the exponent is 5, so the degree is 5, not 7.",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q21",
     "type": "tf",
     "prompt": "In the polynomial 2x³ − 5x⁵ + x, the leading coefficient is 2.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The highest-degree term is −5x⁵ (degree 5), so the leading coefficient is −5, not 2.",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q22",
     "type": "tf",
     "prompt": "To subtract one polynomial from another, you add the opposite of every term in the polynomial being subtracted.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Subtracting a polynomial means distributing a negative sign across it, which flips the sign of each of its terms before combining like terms.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q23",
     "type": "tf",
     "prompt": "(4x² + 3x) + (2x² − 3x) simplifies to 6x².",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Combine like terms: the x² terms add to 6x², and the x terms cancel because 3x − 3x = 0, leaving just 6x².",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q24",
     "type": "tf",
     "prompt": "FOIL stands for First, Outer, Inner, Last, describing the four products formed when multiplying two binomials.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "FOIL is a memory device for the four term-by-term products used to multiply two binomials.",
     "topic": "Multiplying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q25",
     "type": "tf",
     "prompt": "The box (area) method can only be used to multiply two binomials, never a binomial by a trinomial.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The box method works for multiplying polynomials of any size; the grid just needs one row or column for each term of every factor.",
     "topic": "Multiplying Polynomials",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u8-q26",
     "type": "tf",
     "prompt": "(a + b)² is equal to a² + b².",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "(a + b)² = a² + 2ab + b²; the middle term 2ab is required, since squaring a binomial is not the same as squaring each term separately.",
     "topic": "Special Products",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q27",
     "type": "tf",
     "prompt": "In (x + 5)(x − 5), the outer and inner products cancel, leaving no x-term in the result.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "In (a + b)(a − b), the outer and inner products (−5x and +5x) are opposites and cancel, leaving only a² − b².",
     "topic": "Special Products",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q28",
     "type": "written",
     "prompt": "How many terms does a binomial have?",
     "answer": "2",
     "accept": [
      "two",
      "Two"
     ],
     "explanation": "\"Binomial\" comes from \"bi-\" meaning two, so it has exactly two terms.",
     "topic": "Naming & Classifying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q29",
     "type": "written",
     "prompt": "What is the degree of the monomial 9x⁷?",
     "answer": "7",
     "accept": [],
     "explanation": "The degree of a single-variable monomial is the exponent on the variable, which is 7.",
     "topic": "Degree & Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q30",
     "type": "written",
     "prompt": "What is the leading coefficient of −3x⁴ + 8x² − x (already written in standard form)?",
     "answer": "-3",
     "accept": [
      "−3"
     ],
     "explanation": "The term with the highest degree, −3x⁴, has coefficient −3, which is the leading coefficient.",
     "topic": "Degree & Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q31",
     "type": "written",
     "prompt": "If a trinomial has degree 4, what is the greatest exponent found among its terms?",
     "answer": "4",
     "accept": [
      "four"
     ],
     "explanation": "The degree of a polynomial equals the highest exponent appearing in any of its terms, so that exponent is 4.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q32",
     "type": "written",
     "prompt": "Evaluate the polynomial 2x² − 3x + 1 at x = 3.",
     "answer": "10",
     "accept": [],
     "explanation": "Substitute x = 3: 2(3)² − 3(3) + 1 = 2(9) − 9 + 1 = 18 − 9 + 1 = 10.",
     "topic": "Adding & Subtracting Polynomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q33",
     "type": "written",
     "prompt": "In FOIL, what does the letter \"O\" stand for?",
     "answer": "Outer",
     "accept": [
      "Outside",
      "Outer terms",
      "Outside terms",
      "Outers"
     ],
     "explanation": "FOIL's second step multiplies the Outer (outside) pair of terms in the two binomials.",
     "topic": "Multiplying Polynomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u8-q34",
     "type": "written",
     "prompt": "When (x + 9)² is expanded to x² + ___x + 81, what number goes in the blank?",
     "answer": "18",
     "accept": [],
     "explanation": "(a + b)² = a² + 2ab + b²; with a = x and b = 9, the middle term is 2(x)(9) = 18x, so the missing coefficient is 18.",
     "topic": "Special Products",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u8-q35",
     "type": "written",
     "prompt": "Using the box method, multiply (x + 5)(x + 2). What is the constant term (the number with no variable) in the product?",
     "answer": "10",
     "accept": [],
     "explanation": "The constant term of the product comes from multiplying the two constants together: 5·2 = 10.",
     "topic": "Multiplying Polynomials",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u9",
   "unit": 9,
   "title": "Factoring",
   "summary": "Learn to factor polynomials using the GCF, methods for trinomials of the form x² + bx + c and ax² + bx + c, special patterns like the difference of squares and perfect square trinomials, and factoring by grouping. Then use the Zero Product Property to solve quadratic equations by factoring.",
   "topics": [
    "Greatest Common Factor",
    "Factoring x² + bx + c",
    "Factoring ax² + bx + c",
    "Difference of Squares",
    "Perfect Square Trinomials",
    "Factoring by Grouping",
    "Zero Product Property"
   ],
   "terms": [
    {
     "term": "Factor (verb)",
     "definition": "To rewrite a number or expression as a product of two or more simpler numbers or expressions.",
     "topic": "Greatest Common Factor"
    },
    {
     "term": "Greatest Common Factor (GCF)",
     "definition": "The largest number or monomial that divides evenly into each of two or more numbers or terms.",
     "topic": "Greatest Common Factor"
    },
    {
     "term": "Factor completely",
     "definition": "To break an expression into pieces that multiply together until none of those pieces can be split any further.",
     "topic": "Greatest Common Factor"
    },
    {
     "term": "Common monomial factor",
     "definition": "A single term, such as a number or variable power, that divides evenly into every term of a polynomial.",
     "topic": "Greatest Common Factor"
    },
    {
     "term": "Trinomial",
     "definition": "A polynomial made up of exactly three terms.",
     "topic": "Factoring x² + bx + c"
    },
    {
     "term": "Constant term",
     "definition": "The term of a polynomial that has no variable attached to it.",
     "topic": "Factoring x² + bx + c"
    },
    {
     "term": "Factor pair",
     "definition": "Two numbers that multiply together to give a chosen product.",
     "topic": "Factoring x² + bx + c"
    },
    {
     "term": "Prime polynomial",
     "definition": "A polynomial that cannot be split into two lower-degree polynomials with integer coefficients.",
     "topic": "Factoring x² + bx + c"
    },
    {
     "term": "Leading coefficient",
     "definition": "The number multiplying the variable with the highest exponent in a polynomial.",
     "topic": "Factoring ax² + bx + c"
    },
    {
     "term": "AC method",
     "definition": "A strategy for factoring ax² + bx + c that splits the middle term using two numbers whose product is a·c and whose sum is b.",
     "topic": "Factoring ax² + bx + c"
    },
    {
     "term": "Middle term",
     "definition": "In a trinomial, the term containing the variable raised to the first power, placed between the squared term and the constant.",
     "topic": "Factoring ax² + bx + c"
    },
    {
     "term": "Binomial",
     "definition": "A polynomial made up of exactly two terms.",
     "topic": "Factoring by Grouping"
    },
    {
     "term": "Factoring by grouping",
     "definition": "Splitting a four-term polynomial into two pairs and pulling a common factor from each pair to reveal a shared binomial.",
     "topic": "Factoring by Grouping"
    },
    {
     "term": "Common binomial factor",
     "definition": "A binomial that appears in both pairs after a four-term polynomial has been split into two groups.",
     "topic": "Factoring by Grouping"
    },
    {
     "term": "Difference of squares",
     "definition": "A binomial of the form a² − b², which always splits into (a + b)(a − b).",
     "topic": "Difference of Squares"
    },
    {
     "term": "Perfect square (number)",
     "definition": "A number or expression obtained by multiplying another number or expression by itself.",
     "topic": "Difference of Squares"
    },
    {
     "term": "Perfect square trinomial",
     "definition": "A trinomial produced by multiplying a binomial by itself, matching the pattern a² ± 2ab + b².",
     "topic": "Perfect Square Trinomials"
    },
    {
     "term": "Square root",
     "definition": "A value that, multiplied by itself, gives a chosen number or expression.",
     "topic": "Perfect Square Trinomials"
    },
    {
     "term": "Zero Product Property",
     "definition": "The principle that when several factors multiply to 0, at least one of those factors must itself be 0.",
     "topic": "Zero Product Property"
    },
    {
     "term": "Root of an equation",
     "definition": "A value of the variable that makes an equation true when substituted in.",
     "topic": "Zero Product Property"
    },
    {
     "term": "Quadratic equation",
     "definition": "An equation that can be written in the form ax² + bx + c = 0, with a ≠ 0.",
     "topic": "Zero Product Property"
    },
    {
     "term": "Solution set",
     "definition": "The complete list of values that make an equation true.",
     "topic": "Zero Product Property"
    }
   ],
   "questions": [
    {
     "id": "alg1-u9-q1",
     "type": "mc",
     "prompt": "What is the greatest common factor (GCF) of 12x³ and 18x²?",
     "options": [
      "6x²",
      "6x³",
      "36x²",
      "3x²"
     ],
     "answer": "6x²",
     "explanation": "The numeric GCF of 12 and 18 is 6 (12 = 2²·3, 18 = 2·3², shared 2·3 = 6). The lowest power of x shared is x². So the GCF is 6x².",
     "topic": "Greatest Common Factor",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q2",
     "type": "mc",
     "prompt": "Factor completely: 8x + 12",
     "options": [
      "4(2x + 3)",
      "4(2x + 8)",
      "2(4x + 6)",
      "4x(2 + 3)"
     ],
     "answer": "4(2x + 3)",
     "explanation": "The GCF of 8 and 12 is 4, so 8x + 12 = 4(2x + 3). Check: 4·2x = 8x and 4·3 = 12. Note 2(4x + 6) is not fully factored since 4x + 6 still shares a factor of 2.",
     "topic": "Greatest Common Factor",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q3",
     "type": "mc",
     "prompt": "Factor: x² + 7x + 12",
     "options": [
      "(x + 3)(x + 4)",
      "(x + 2)(x + 6)",
      "(x + 1)(x + 12)",
      "(x − 3)(x − 4)"
     ],
     "answer": "(x + 3)(x + 4)",
     "explanation": "Find two numbers that multiply to 12 and add to 7: 3 and 4. Check: (x+3)(x+4) = x² + 4x + 3x + 12 = x² + 7x + 12.",
     "topic": "Factoring x² + bx + c",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q4",
     "type": "mc",
     "prompt": "Factor: x² − 2x − 15",
     "options": [
      "(x + 3)(x − 5)",
      "(x − 3)(x + 5)",
      "(x + 15)(x − 1)",
      "(x − 15)(x + 1)"
     ],
     "answer": "(x + 3)(x − 5)",
     "explanation": "Find two numbers that multiply to −15 and add to −2: 3 and −5. Check: (x+3)(x−5) = x² − 5x + 3x − 15 = x² − 2x − 15.",
     "topic": "Factoring x² + bx + c",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q5",
     "type": "mc",
     "prompt": "Factor: 2x² + 7x + 3",
     "options": [
      "(2x + 1)(x + 3)",
      "(2x + 3)(x + 1)",
      "(2x − 1)(x − 3)",
      "(x + 1)(2x − 3)"
     ],
     "answer": "(2x + 1)(x + 3)",
     "explanation": "Using the AC method: a·c = 2·3 = 6, and 6 and 1 multiply to 6 and add to 7. Split: 2x² + 6x + x + 3 = 2x(x+3) + 1(x+3) = (2x+1)(x+3). Check: 2x²+6x+x+3 = 2x²+7x+3.",
     "topic": "Factoring ax² + bx + c",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q6",
     "type": "mc",
     "prompt": "Factor: 3x² − 5x − 2",
     "options": [
      "(3x + 1)(x − 2)",
      "(3x − 1)(x + 2)",
      "(3x + 2)(x − 1)",
      "(3x − 2)(x + 1)"
     ],
     "answer": "(3x + 1)(x − 2)",
     "explanation": "a·c = 3·(−2) = −6; −6 and 1 multiply to −6 and add to −5. Split: 3x² − 6x + x − 2 = 3x(x−2) + 1(x−2) = (3x+1)(x−2). Check: 3x²−6x+x−2 = 3x²−5x−2.",
     "topic": "Factoring ax² + bx + c",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q7",
     "type": "mc",
     "prompt": "Factor: x² − 25",
     "options": [
      "(x + 5)(x − 5)",
      "(x − 5)(x − 5)",
      "(x + 5)(x + 5)",
      "(x − 25)(x + 1)"
     ],
     "answer": "(x + 5)(x − 5)",
     "explanation": "25 = 5², so x² − 25 is a difference of squares: (x+5)(x−5). Check: x² − 5x + 5x − 25 = x² − 25.",
     "topic": "Difference of Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q8",
     "type": "mc",
     "prompt": "Factor: 9x² − 16",
     "options": [
      "(3x + 4)(3x − 4)",
      "(3x − 4)(3x − 4)",
      "(9x + 16)(9x − 16)",
      "(3x + 4)(3x + 4)"
     ],
     "answer": "(3x + 4)(3x − 4)",
     "explanation": "9x² = (3x)² and 16 = 4², so this is a difference of squares: (3x+4)(3x−4). Check: 9x² − 12x + 12x − 16 = 9x² − 16, the middle terms cancel as expected.",
     "topic": "Difference of Squares",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q9",
     "type": "mc",
     "prompt": "Factor: x² + 10x + 25",
     "options": [
      "(x + 5)(x + 5)",
      "(x − 5)(x − 5)",
      "(x + 5)(x − 5)",
      "(x + 25)(x + 1)"
     ],
     "answer": "(x + 5)(x + 5)",
     "explanation": "Since 25 = 5² and the middle term 10x = 2(5)(x), this is a perfect square trinomial: (x+5)². Check: x² + 5x + 5x + 25 = x² + 10x + 25.",
     "topic": "Perfect Square Trinomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q10",
     "type": "mc",
     "prompt": "Factor: 4x² − 12x + 9",
     "options": [
      "(2x − 3)(2x − 3)",
      "(2x + 3)(2x + 3)",
      "(2x − 3)(2x + 3)",
      "(4x − 9)(x − 1)"
     ],
     "answer": "(2x − 3)(2x − 3)",
     "explanation": "4x² = (2x)², 9 = 3², and the middle term −12x = 2(2x)(−3), so this is a perfect square trinomial: (2x−3)². Check: 4x² − 6x − 6x + 9 = 4x² − 12x + 9.",
     "topic": "Perfect Square Trinomials",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q11",
     "type": "mc",
     "prompt": "Factor by grouping: x³ + 3x² + 2x + 6",
     "options": [
      "(x + 3)(x² + 2)",
      "(x + 2)(x² + 3)",
      "(x + 3)(x² − 2)",
      "(x − 3)(x² + 2)"
     ],
     "answer": "(x + 3)(x² + 2)",
     "explanation": "Group (x³ + 3x²) + (2x + 6) = x²(x+3) + 2(x+3) = (x+3)(x²+2). Check: x²·x + x²·3 + 2·x + 2·3 = x³ + 3x² + 2x + 6.",
     "topic": "Factoring by Grouping",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q12",
     "type": "mc",
     "prompt": "Factor completely: 2x³ − 3x² − 8x + 12",
     "options": [
      "(2x − 3)(x − 2)(x + 2)",
      "(2x − 3)(x² − 4)",
      "(2x + 3)(x − 2)(x + 2)",
      "(2x − 3)(x − 2)(x − 2)"
     ],
     "answer": "(2x − 3)(x − 2)(x + 2)",
     "explanation": "Grouping gives (2x−3)(x²−4), but x²−4 is a difference of squares that factors further into (x−2)(x+2). Complete factored form: (2x−3)(x−2)(x+2). Check: (x−2)(x+2)=x²−4, and (2x−3)(x²−4)=2x³−8x−3x²+12=2x³−3x²−8x+12.",
     "topic": "Factoring by Grouping",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q13",
     "type": "mc",
     "prompt": "Use the Zero Product Property to solve: (x − 4)(x + 2) = 0",
     "options": [
      "x = 4 or x = −2",
      "x = −4 or x = 2",
      "x = 4 or x = 2",
      "x = −4 or x = −2"
     ],
     "answer": "x = 4 or x = −2",
     "explanation": "Set each factor equal to 0: x − 4 = 0 gives x = 4, and x + 2 = 0 gives x = −2.",
     "topic": "Zero Product Property",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q14",
     "type": "mc",
     "prompt": "Solve: x² − 9x + 20 = 0",
     "options": [
      "x = 4 or x = 5",
      "x = −4 or x = −5",
      "x = 4 or x = −5",
      "x = 2 or x = 10"
     ],
     "answer": "x = 4 or x = 5",
     "explanation": "Factor first: need two numbers multiplying to 20 and adding to −9, which are −4 and −5, so x² − 9x + 20 = (x−4)(x−5) = 0. By the Zero Product Property, x = 4 or x = 5. Check: 4+5=9 and 4·5=20. ✓",
     "topic": "Zero Product Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q15",
     "type": "mc",
     "prompt": "Solve: 2x² + 5x − 3 = 0",
     "options": [
      "x = 1/2 or x = −3",
      "x = −1/2 or x = 3",
      "x = 1/2 or x = 3",
      "x = 2 or x = −3"
     ],
     "answer": "x = 1/2 or x = −3",
     "explanation": "a·c = 2·(−3) = −6; 6 and −1 multiply to −6 and add to 5. Split and group: 2x²+6x−x−3 = 2x(x+3)−1(x+3) = (2x−1)(x+3) = 0, so x = 1/2 or x = −3. Check: 2(1/2)²+5(1/2)−3 = 0.5+2.5−3 = 0 ✓; 2(9)+5(−3)−3 = 18−15−3 = 0 ✓.",
     "topic": "Zero Product Property",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q16",
     "type": "mc",
     "prompt": "A rectangle has area 10x² + 15x square units and length 5x. What is the width?",
     "options": [
      "2x + 3",
      "2x + 5",
      "5x + 3",
      "2x − 3"
     ],
     "answer": "2x + 3",
     "explanation": "Factor out the GCF: 10x² + 15x = 5x(2x + 3). Since Area = length × width and length = 5x, the width must be 2x + 3. Check: 5x(2x+3) = 10x² + 15x. ✓",
     "topic": "Greatest Common Factor",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q17",
     "type": "mc",
     "prompt": "A ball's height is modeled by h = −(x − 3)(x − 7), where x is time in seconds. Using the Zero Product Property, at what times is the ball at height 0?",
     "options": [
      "x = 3 and x = 7",
      "x = −3 and x = −7",
      "x = 3 and x = −7",
      "x = 0 and x = 10"
     ],
     "answer": "x = 3 and x = 7",
     "explanation": "Setting h = 0 gives −(x−3)(x−7) = 0, so (x−3)(x−7) = 0. By the Zero Product Property, x − 3 = 0 or x − 7 = 0, giving x = 3 or x = 7.",
     "topic": "Zero Product Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q18",
     "type": "tf",
     "prompt": "The GCF of 15x² and 25x is 5x.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The numeric GCF of 15 and 25 is 5, and the lowest shared power of x is x¹. So the GCF is 5x, matching the statement.",
     "topic": "Greatest Common Factor",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q19",
     "type": "tf",
     "prompt": "x² + 5x + 6 factors as (x + 1)(x + 6).",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "(x+1)(x+6) = x² + 7x + 6, not x² + 5x + 6. The correct factorization uses 2 and 3 (which multiply to 6 and add to 5): (x+2)(x+3) = x² + 5x + 6.",
     "topic": "Factoring x² + bx + c",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q20",
     "type": "tf",
     "prompt": "6x² + 11x + 3 factors as (3x + 1)(2x + 3).",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Check by multiplying: (3x+1)(2x+3) = 6x² + 9x + 2x + 3 = 6x² + 11x + 3, which matches.",
     "topic": "Factoring ax² + bx + c",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q21",
     "type": "tf",
     "prompt": "x² − 49 factors as (x + 7)(x − 7).",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "49 = 7², so this is a difference of squares. Check: (x+7)(x−7) = x² − 7x + 7x − 49 = x² − 49.",
     "topic": "Difference of Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q22",
     "type": "tf",
     "prompt": "x² − 8x + 16 factors as (x + 4)².",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "(x+4)² = x² + 8x + 16, which has the wrong sign on the middle term. Since the middle term is −8x, the correct factorization is (x−4)² = x² − 8x + 16.",
     "topic": "Perfect Square Trinomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q23",
     "type": "tf",
     "prompt": "The equation (x − 5)(x + 2) = 0 has solutions x = 5 and x = 2.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Setting each factor to 0 gives x − 5 = 0, so x = 5, and x + 2 = 0, so x = −2 (not 2).",
     "topic": "Zero Product Property",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q24",
     "type": "written",
     "prompt": "What is the greatest common factor of 24 and 36?",
     "answer": "12",
     "accept": [
      "GCF=12",
      "GCF = 12"
     ],
     "explanation": "24 = 2³·3 and 36 = 2²·3². The shared factors are 2² and 3, so the GCF is 4·3 = 12.",
     "topic": "Greatest Common Factor",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q25",
     "type": "written",
     "prompt": "If x² + bx + 20 factors as (x + 4)(x + 5), what is the value of b?",
     "answer": "9",
     "accept": [
      "b=9",
      "b = 9"
     ],
     "explanation": "Expanding (x+4)(x+5) = x² + 9x + 20, since 4+5=9 and 4·5=20. So b = 9.",
     "topic": "Factoring x² + bx + c",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q26",
     "type": "written",
     "prompt": "When factoring 3x² + 10x + 8 using the AC method, what two numbers multiply to 24 (3 × 8) and add to 10?",
     "answer": "4 and 6",
     "accept": [
      "6 and 4",
      "4, 6",
      "6, 4",
      "4,6",
      "6,4",
      "4 & 6",
      "6 & 4",
      "4 6",
      "6 4",
      "4 and 6.",
      "four and six",
      "six and four"
     ],
     "explanation": "a·c = 3·8 = 24. The numbers 4 and 6 multiply to 24 (4·6 = 24) and add to 10 (4 + 6 = 10), so you can split the middle term: 3x² + 4x + 6x + 8 = x(3x + 4) + 2(3x + 4) = (3x + 4)(x + 2).",
     "topic": "Factoring ax² + bx + c",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u9-q27",
     "type": "written",
     "prompt": "The binomial 4x² − 81 factors as (2x + b)(2x − b). What is the positive value of b?",
     "answer": "9",
     "accept": [
      "b=9",
      "b = 9",
      "nine"
     ],
     "explanation": "4x² = (2x)² and 81 = 9², so 4x² − 81 = (2x + 9)(2x − 9). Check: (2x + 9)(2x − 9) = 4x² − 18x + 18x − 81 = 4x² − 81.",
     "topic": "Difference of Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u9-q28",
     "type": "written",
     "prompt": "The trinomial x² + 14x + 49 factors as (x + k)². What is the value of k?",
     "answer": "7",
     "accept": [
      "k=7",
      "k = 7",
      "seven"
     ],
     "explanation": "49 = 7² and the middle term 14x = 2(7)(x), so x² + 14x + 49 = (x + 7)². Check: (x + 7)(x + 7) = x² + 7x + 7x + 49 = x² + 14x + 49.",
     "topic": "Perfect Square Trinomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q29",
     "type": "written",
     "prompt": "Factoring by grouping, x³ + 5x² + 3x + 15 = (x² + 3)(x + k). What is the value of k?",
     "answer": "5",
     "accept": [
      "k=5",
      "k = 5",
      "five"
     ],
     "explanation": "Group: (x³ + 5x²) + (3x + 15) = x²(x + 5) + 3(x + 5) = (x² + 3)(x + 5), so k = 5. Check: x²·x + x²·5 + 3·x + 3·5 = x³ + 5x² + 3x + 15.",
     "topic": "Factoring by Grouping",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q30",
     "type": "written",
     "prompt": "Solve for x: (x − 6)(x + 6) = 0. Give the positive solution.",
     "answer": "6",
     "accept": [
      "x=6",
      "x = 6"
     ],
     "explanation": "By the Zero Product Property, x − 6 = 0 or x + 6 = 0, giving x = 6 or x = −6. The positive solution is 6.",
     "topic": "Zero Product Property",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u9-q31",
     "type": "written",
     "prompt": "Solve: x² = 9x. What is the nonzero solution?",
     "answer": "9",
     "accept": [
      "x=9",
      "x = 9"
     ],
     "explanation": "Rearrange to x² − 9x = 0, then factor: x(x − 9) = 0. By the Zero Product Property, x = 0 or x = 9, so the nonzero solution is 9.",
     "topic": "Zero Product Property",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u10",
   "unit": 10,
   "title": "Quadratic Functions and Equations",
   "summary": "This unit covers parabolas and their key features — vertex, axis of symmetry, and maximum or minimum value — along with standard form y = ax² + bx + c and what the value of a reveals about the graph. It also covers finding zeros, roots and x-intercepts, and solving quadratic equations by graphing, factoring, square roots, completing the square and the quadratic formula, including using the discriminant to predict the number of real solutions.",
   "topics": [
    "Parabolas & Key Features",
    "Standard Form",
    "Zeros & X-Intercepts",
    "Solving by Factoring & Square Roots",
    "Completing the Square",
    "Quadratic Formula",
    "The Discriminant"
   ],
   "terms": [
    {
     "term": "Parabola",
     "definition": "The U-shaped graph produced by any quadratic function.",
     "topic": "Parabolas & Key Features"
    },
    {
     "term": "Vertex",
     "definition": "The turning point of a parabola, where it reaches its maximum or minimum value.",
     "topic": "Parabolas & Key Features"
    },
    {
     "term": "Axis of symmetry",
     "definition": "The vertical line x = −b/(2a) that splits a parabola into two mirror-image halves.",
     "topic": "Parabolas & Key Features"
    },
    {
     "term": "Maximum value",
     "definition": "The greatest y-value on a parabola, reached at the vertex when the parabola opens downward.",
     "topic": "Parabolas & Key Features"
    },
    {
     "term": "Minimum value",
     "definition": "The least y-value on a parabola, reached at the vertex when the parabola opens upward.",
     "topic": "Parabolas & Key Features"
    },
    {
     "term": "Standard form",
     "definition": "The form y = ax² + bx + c, where a, b and c are constants and a ≠ 0.",
     "topic": "Standard Form"
    },
    {
     "term": "Leading coefficient",
     "definition": "The constant a in y = ax² + bx + c; its sign and size control the parabola's direction and width.",
     "topic": "Standard Form"
    },
    {
     "term": "Opens upward",
     "definition": "What a parabola does when its leading coefficient is positive, giving it a minimum point.",
     "topic": "Standard Form"
    },
    {
     "term": "Opens downward",
     "definition": "What a parabola does when its leading coefficient is negative, giving it a maximum point.",
     "topic": "Standard Form"
    },
    {
     "term": "Zero of a function",
     "definition": "An input value that makes a function's output equal 0.",
     "topic": "Zeros & X-Intercepts"
    },
    {
     "term": "Root",
     "definition": "Another name for a solution of an equation set equal to 0.",
     "topic": "Zeros & X-Intercepts"
    },
    {
     "term": "x-intercept",
     "definition": "A point where a graph crosses or touches the x-axis, found by setting y equal to 0.",
     "topic": "Zeros & X-Intercepts"
    },
    {
     "term": "Solving by graphing",
     "definition": "Finding a quadratic equation's solutions by reading where its parabola crosses or touches the x-axis.",
     "topic": "Zeros & X-Intercepts"
    },
    {
     "term": "Zero product property",
     "definition": "If two factors multiply to 0, at least one of them must equal 0; the basis for solving by factoring.",
     "topic": "Solving by Factoring & Square Roots"
    },
    {
     "term": "Square root method",
     "definition": "Solving x² = k by undoing the squaring on both sides, giving x = ±√k.",
     "topic": "Solving by Factoring & Square Roots"
    },
    {
     "term": "Plus-or-minus symbol",
     "definition": "The sign ±, showing two values: one found by adding and one by subtracting.",
     "topic": "Solving by Factoring & Square Roots"
    },
    {
     "term": "Completing the square",
     "definition": "Adding (b/2)² to x² + bx so the expression factors as (x + b/2)².",
     "topic": "Completing the Square"
    },
    {
     "term": "Perfect-square trinomial",
     "definition": "A three-term expression that factors as (x + k)² or (x − k)², such as x² + 6x + 9.",
     "topic": "Completing the Square"
    },
    {
     "term": "Vertex form",
     "definition": "The form y = a(x − h)² + k, where (h, k) is the parabola's turning point.",
     "topic": "Completing the Square"
    },
    {
     "term": "Quadratic formula",
     "definition": "x = (−b ± √(b² − 4ac)) / (2a), used to solve any equation ax² + bx + c = 0.",
     "topic": "Quadratic Formula"
    },
    {
     "term": "Coefficients a, b and c",
     "definition": "The three numbers in ax² + bx + c = 0, substituted directly into the quadratic formula.",
     "topic": "Quadratic Formula"
    },
    {
     "term": "Discriminant",
     "definition": "The expression b² − 4ac, whose sign tells how many real solutions a quadratic equation has.",
     "topic": "The Discriminant"
    },
    {
     "term": "Two real solutions",
     "definition": "What a quadratic equation has when its discriminant b² − 4ac is positive.",
     "topic": "The Discriminant"
    },
    {
     "term": "One real solution",
     "definition": "What a quadratic equation has when its discriminant b² − 4ac equals 0.",
     "topic": "The Discriminant"
    },
    {
     "term": "No real solutions",
     "definition": "What a quadratic equation has when its discriminant b² − 4ac is negative.",
     "topic": "The Discriminant"
    }
   ],
   "questions": [
    {
     "id": "alg1-u10-q1",
     "type": "mc",
     "prompt": "What shape is the graph of any quadratic function?",
     "options": [
      "A parabola (a U-shaped curve)",
      "A straight line",
      "A V-shaped curve with a sharp corner",
      "A circle"
     ],
     "answer": "A parabola (a U-shaped curve)",
     "explanation": "Every quadratic function y = ax² + bx + c graphs as a parabola, a smooth U-shaped curve (an upside-down U if a is negative).",
     "topic": "Parabolas & Key Features",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q2",
     "type": "mc",
     "prompt": "What is the vertex of a parabola?",
     "options": [
      "The point where the parabola turns and reaches its maximum or minimum",
      "The point where the parabola crosses the x-axis",
      "The vertical line that divides the parabola into two equal halves",
      "The steepness of the parabola's sides"
     ],
     "answer": "The point where the parabola turns and reaches its maximum or minimum",
     "explanation": "The vertex is the turning point of a parabola — its highest point if it opens downward, or its lowest point if it opens upward.",
     "topic": "Parabolas & Key Features",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q3",
     "type": "written",
     "prompt": "Find the axis of symmetry of y = x² − 6x + 5.",
     "answer": "x = 3",
     "accept": [
      "x=3",
      "3"
     ],
     "explanation": "Axis of symmetry: x = −b/(2a) = −(−6)/(2·1) = 6/2 = 3.",
     "topic": "Parabolas & Key Features",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q4",
     "type": "tf",
     "prompt": "The axis of symmetry of a parabola always passes through its vertex.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The axis of symmetry, x = −b/(2a), is the vertical line through the vertex that splits the parabola into two mirror-image halves.",
     "topic": "Parabolas & Key Features",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q5",
     "type": "mc",
     "prompt": "A parabola has equation y = 2x² − 8x + 3. What is its axis of symmetry?",
     "options": [
      "x = 2",
      "x = −2",
      "x = 4",
      "x = 8"
     ],
     "answer": "x = 2",
     "explanation": "x = −b/(2a) = −(−8)/(2·2) = 8/4 = 2.",
     "topic": "Parabolas & Key Features",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q6",
     "type": "written",
     "prompt": "Find the vertex of y = x² − 4x + 1. Give your answer as an ordered pair.",
     "answer": "(2, -3)",
     "accept": [
      "(2,-3)",
      "(2, −3)",
      "(2,−3)",
      "2, -3",
      "2,-3"
     ],
     "explanation": "Axis of symmetry: x = −(−4)/(2·1) = 2. Substitute: y = (2)² − 4(2) + 1 = 4 − 8 + 1 = −3, so the vertex is (2, −3).",
     "topic": "Parabolas & Key Features",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u10-q7",
     "type": "mc",
     "prompt": "In y = ax² + bx + c, what does the sign of a tell you?",
     "options": [
      "Whether the parabola opens upward (positive) or downward (negative)",
      "Whether the parabola crosses the x-axis (positive) or not (negative)",
      "Whether the vertex is right (positive) or left (negative) of the y-axis",
      "Whether the y-intercept is above (positive) or below (negative) the x-axis"
     ],
     "answer": "Whether the parabola opens upward (positive) or downward (negative)",
     "explanation": "A positive leading coefficient a makes the parabola open upward, giving it a minimum; a negative a makes it open downward, giving it a maximum. The y-intercept depends on c, and the vertex's side depends on both a and b.",
     "topic": "Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q8",
     "type": "tf",
     "prompt": "For y = −3x² + 2x − 1, the parabola opens upward because a is negative.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Here a = −3, which is negative, so the parabola opens downward, not upward.",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q9",
     "type": "mc",
     "prompt": "Which equation's graph opens downward and is narrower than y = x²?",
     "options": [
      "y = −3x² + 4",
      "y = −0.5x² + 4",
      "y = 3x² − 1",
      "y = 0.5x² − 1"
     ],
     "answer": "y = −3x² + 4",
     "explanation": "A negative a opens the parabola downward, and |a| > 1 makes it narrower than y = x²; only y = −3x² + 4 has both, since a = −3.",
     "topic": "Standard Form",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q10",
     "type": "written",
     "prompt": "In y = 4x² − 7x + 9, what is the value of c?",
     "answer": "9",
     "accept": [
      "c = 9",
      "c=9"
     ],
     "explanation": "In standard form y = ax² + bx + c, c is the constant term — here it's 9.",
     "topic": "Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q11",
     "type": "tf",
     "prompt": "In standard form y = ax² + bx + c, the value of c is the parabola's y-intercept.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Setting x = 0 gives y = a(0)² + b(0) + c = c, so the graph always crosses the y-axis at (0, c).",
     "topic": "Standard Form",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q12",
     "type": "mc",
     "prompt": "A zero of a quadratic function is also known as a ___.",
     "options": [
      "root or x-intercept",
      "vertex",
      "axis of symmetry",
      "leading coefficient"
     ],
     "answer": "root or x-intercept",
     "explanation": "Zero, root, and x-intercept all name the same thing: an x-value where the function's output equals 0.",
     "topic": "Zeros & X-Intercepts",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q13",
     "type": "mc",
     "prompt": "What are the x-intercepts of y = (x − 2)(x + 5)?",
     "options": [
      "(2, 0) and (−5, 0)",
      "(−2, 0) and (5, 0)",
      "(2, 0) and (5, 0)",
      "(−2, 0) and (−5, 0)"
     ],
     "answer": "(2, 0) and (−5, 0)",
     "explanation": "Setting each factor to 0: x − 2 = 0 gives x = 2, and x + 5 = 0 gives x = −5, so the intercepts are (2, 0) and (−5, 0).",
     "topic": "Zeros & X-Intercepts",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q14",
     "type": "written",
     "prompt": "How many x-intercepts does the parabola y = x² + 4 have?",
     "answer": "0",
     "accept": [
      "none",
      "zero",
      "no",
      "no x-intercepts",
      "0 x-intercepts",
      "zero x-intercepts"
     ],
     "explanation": "Since x² ≥ 0 for every real x, x² + 4 ≥ 4 is always positive, so the graph never touches the x-axis, which means it has 0 x-intercepts.",
     "topic": "Zeros & X-Intercepts",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q15",
     "type": "tf",
     "prompt": "The x-intercepts of a parabola are found by setting y = 0 and solving for x.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "An x-intercept is a point on the x-axis, where y = 0 by definition, so solving y = 0 gives the x-intercepts.",
     "topic": "Zeros & X-Intercepts",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q16",
     "type": "mc",
     "prompt": "A ball's height is modeled by h(t) = −16t² + 64t, with t in seconds. At what times is the ball's height equal to 0?",
     "options": [
      "t = 0 and t = 4 seconds",
      "t = 0 and t = 16 seconds",
      "t = 0 and t = −4 seconds",
      "t = −4 and t = 4 seconds"
     ],
     "answer": "t = 0 and t = 4 seconds",
     "explanation": "Factor: −16t² + 64t = −16t(t − 4) = 0, so t = 0 (launch) or t = 4 (landing) seconds. Check: −16(16) + 64(4) = −256 + 256 = 0.",
     "topic": "Zeros & X-Intercepts",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u10-q17",
     "type": "mc",
     "prompt": "The zero product property says that if a · b = 0, then...",
     "options": [
      "a = 0 or b = 0",
      "a = 0 and b = 0",
      "a = 1 or b = 1",
      "a + b = 0"
     ],
     "answer": "a = 0 or b = 0",
     "explanation": "The zero product property states a product can equal 0 only when at least one factor equals 0 — the basis for solving by factoring.",
     "topic": "Solving by Factoring & Square Roots",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q18",
     "type": "written",
     "prompt": "Solve by factoring: x² − 5x + 6 = 0. Give the smaller solution.",
     "answer": "x = 2",
     "accept": [
      "x=2",
      "2"
     ],
     "explanation": "x² − 5x + 6 factors as (x − 2)(x − 3) = 0, giving x = 2 or x = 3. Check: 2² − 5(2) + 6 = 4 − 10 + 6 = 0. The smaller solution is x = 2.",
     "topic": "Solving by Factoring & Square Roots",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q19",
     "type": "mc",
     "prompt": "Which pair of solutions comes from solving x² − x − 12 = 0 by factoring?",
     "options": [
      "x = 4 and x = −3",
      "x = −4 and x = 3",
      "x = 4 and x = 3",
      "x = −4 and x = −3"
     ],
     "answer": "x = 4 and x = −3",
     "explanation": "x² − x − 12 factors as (x − 4)(x + 3) = 0, since −4 · 3 = −12 and −4 + 3 = −1, so x = 4 or x = −3.",
     "topic": "Solving by Factoring & Square Roots",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q20",
     "type": "tf",
     "prompt": "Solving x² = 16 by the square root method gives only one solution, x = 4.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Taking the square root of both sides gives x = ±4 — two solutions, x = 4 and x = −4, since both squares equal 16.",
     "topic": "Solving by Factoring & Square Roots",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q21",
     "type": "mc",
     "prompt": "Solve using the square root method: x² = 49.",
     "options": [
      "x = 7 or x = −7",
      "x = 7 only",
      "x = −7 only",
      "x = 24.5"
     ],
     "answer": "x = 7 or x = −7",
     "explanation": "Taking the square root of both sides of x² = 49 gives x = ±7, since 7² = 49 and (−7)² = 49.",
     "topic": "Solving by Factoring & Square Roots",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q22",
     "type": "mc",
     "prompt": "What is the first step in solving x² + 6x + 2 = 0 by completing the square?",
     "options": [
      "Move the constant term to the other side of the equation",
      "Factor out the leading coefficient from every term",
      "Take the square root of both sides immediately",
      "Divide every term by 6"
     ],
     "answer": "Move the constant term to the other side of the equation",
     "explanation": "Completing the square starts by isolating the x² and x terms: x² + 6x = −2, so a perfect-square trinomial can be built on the left side.",
     "topic": "Completing the Square",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q23",
     "type": "written",
     "prompt": "Complete the square: what number should be added to both sides of x² + 8x = 3 to create a perfect-square trinomial?",
     "answer": "16",
     "accept": [
      "+16",
      "add 16"
     ],
     "explanation": "Take half of the x-coefficient (8/2 = 4) and square it: 4² = 16, so add 16 to both sides, giving x² + 8x + 16 = 19, or (x + 4)² = 19.",
     "topic": "Completing the Square",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u10-q24",
     "type": "mc",
     "prompt": "Which expression is a perfect-square trinomial?",
     "options": [
      "x² + 6x + 9",
      "x² + 6x + 6",
      "x² + 9x + 6",
      "x² + 6x − 9"
     ],
     "answer": "x² + 6x + 9",
     "explanation": "x² + 6x + 9 factors as (x + 3)², since (6/2)² = 9 matches the constant term.",
     "topic": "Completing the Square",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q25",
     "type": "tf",
     "prompt": "Completing the square is used to rewrite a quadratic equation from standard form into vertex form.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Completing the square turns y = ax² + bx + c into y = a(x − h)² + k, which is vertex form and shows the vertex directly.",
     "topic": "Completing the Square",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q26",
     "type": "mc",
     "prompt": "The parabola y = (x − 2)² + 5 is written in vertex form. What is its vertex?",
     "options": [
      "(2, 5)",
      "(−2, 5)",
      "(2, −5)",
      "(5, 2)"
     ],
     "answer": "(2, 5)",
     "explanation": "In vertex form y = a(x − h)² + k, the vertex is (h, k); here x − h = x − 2 means h = 2, and k = 5, so the vertex is (2, 5).",
     "topic": "Completing the Square",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q27",
     "type": "mc",
     "prompt": "What is the quadratic formula used to solve ax² + bx + c = 0?",
     "options": [
      "x = (−b ± √(b² − 4ac)) / (2a)",
      "x = (−b ± √(b² + 4ac)) / (2a)",
      "x = (b ± √(b² − 4ac)) / (2a)",
      "x = (−b ± √(b² − 4ac)) / a"
     ],
     "answer": "x = (−b ± √(b² − 4ac)) / (2a)",
     "explanation": "The quadratic formula is x = (−b ± √(b² − 4ac)) / (2a); the other choices change a sign inside the square root or the denominator.",
     "topic": "Quadratic Formula",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q28",
     "type": "written",
     "prompt": "Use the quadratic formula to solve x² + 2x − 8 = 0. Give the positive solution.",
     "answer": "x = 2",
     "accept": [
      "x=2",
      "2"
     ],
     "explanation": "b² − 4ac = 2² − 4(1)(−8) = 4 + 32 = 36, so x = (−2 ± √36)/2 = (−2 ± 6)/2, giving x = 2 or x = −4. The positive solution is x = 2.",
     "topic": "Quadratic Formula",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q29",
     "type": "mc",
     "prompt": "Which quadratic formula setup correctly solves 2x² − 3x − 5 = 0?",
     "options": [
      "x = (3 ± √49) / 4",
      "x = (−3 ± √49) / 4",
      "x = (3 ± √49) / 2",
      "x = (3 ± √9) / 4"
     ],
     "answer": "x = (3 ± √49) / 4",
     "explanation": "With a = 2, b = −3, c = −5: −b = 3, b² − 4ac = 9 − 4(2)(−5) = 9 + 40 = 49, and 2a = 4, giving x = (3 ± √49) / 4.",
     "topic": "Quadratic Formula",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u10-q30",
     "type": "tf",
     "prompt": "The quadratic formula can only be used on quadratic equations that also factor evenly.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The quadratic formula works on every quadratic equation with a ≠ 0, including ones that don't factor over the integers — that's exactly why it's useful.",
     "topic": "Quadratic Formula",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q31",
     "type": "mc",
     "prompt": "What is the discriminant of a quadratic equation ax² + bx + c = 0?",
     "options": [
      "b² − 4ac",
      "b² + 4ac",
      "4ac − b²",
      "b² − 4a"
     ],
     "answer": "b² − 4ac",
     "explanation": "The discriminant is the expression b² − 4ac, the part of the quadratic formula found under the square root.",
     "topic": "The Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q32",
     "type": "written",
     "prompt": "Find the discriminant of 2x² + 3x − 1 = 0.",
     "answer": "17",
     "accept": [],
     "explanation": "b² − 4ac = 3² − 4(2)(−1) = 9 + 8 = 17.",
     "topic": "The Discriminant",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q33",
     "type": "mc",
     "prompt": "A quadratic equation has discriminant b² − 4ac = 0. How many real solutions does it have?",
     "options": [
      "Exactly one real solution",
      "Two real solutions",
      "No real solutions",
      "Infinitely many real solutions"
     ],
     "answer": "Exactly one real solution",
     "explanation": "A discriminant of exactly 0 means the ± term in the quadratic formula vanishes, so the equation has exactly one real solution — the vertex touches the x-axis once.",
     "topic": "The Discriminant",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u10-q34",
     "type": "tf",
     "prompt": "A quadratic equation with a negative discriminant has two real solutions.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A negative discriminant means √(b² − 4ac) is not a real number, so the equation has no real solutions, not two.",
     "topic": "The Discriminant",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u10-q35",
     "type": "mc",
     "prompt": "Without fully solving it, how many real solutions does 3x² − 2x + 5 = 0 have?",
     "options": [
      "No real solutions",
      "One real solution",
      "Two real solutions",
      "Three real solutions"
     ],
     "answer": "No real solutions",
     "explanation": "b² − 4ac = (−2)² − 4(3)(5) = 4 − 60 = −56, which is negative, so the equation has no real solutions.",
     "topic": "The Discriminant",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u11",
   "unit": 11,
   "title": "Radicals",
   "summary": "Learn to identify perfect squares and simplify, add, subtract, multiply, and divide radical expressions. You'll also compare rational and irrational numbers and apply the Pythagorean theorem to right triangles.",
   "topics": [
    "Square Roots & Perfect Squares",
    "Principal Square Root",
    "Simplifying Radicals",
    "Multiplying & Dividing Radicals",
    "Adding & Subtracting Radicals",
    "Rational vs Irrational Numbers",
    "Pythagorean Theorem"
   ],
   "terms": [
    {
     "term": "Square root",
     "definition": "A number that, when multiplied by itself, produces a given number.",
     "topic": "Square Roots & Perfect Squares"
    },
    {
     "term": "Perfect square",
     "definition": "The product of an integer multiplied by itself, such as 1, 4, 9, or 16.",
     "topic": "Square Roots & Perfect Squares"
    },
    {
     "term": "Radicand",
     "definition": "The number or expression written inside a radical symbol.",
     "topic": "Principal Square Root"
    },
    {
     "term": "Radical symbol",
     "definition": "The √ mark used to show that a root is being taken.",
     "topic": "Principal Square Root"
    },
    {
     "term": "Principal square root",
     "definition": "The nonnegative root of a number; the value that √a always returns.",
     "topic": "Principal Square Root"
    },
    {
     "term": "Cube root",
     "definition": "A value that, multiplied by itself three times, produces a given number.",
     "topic": "Principal Square Root"
    },
    {
     "term": "Index",
     "definition": "The small number showing which root to take; 2 for square roots, usually left unwritten.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Simplified radical form",
     "definition": "A radical with no perfect-square factors in the radicand, no fraction inside it, and no radical in a denominator.",
     "topic": "Simplifying Radicals"
    },
    {
     "term": "Square root property",
     "definition": "If x² = a and a ≥ 0, then x = √a or x = −√a (x = ±√a).",
     "topic": "Principal Square Root"
    },
    {
     "term": "Product Property of Radicals",
     "definition": "√(a·b) = √a · √b, for nonnegative a and b.",
     "topic": "Multiplying & Dividing Radicals"
    },
    {
     "term": "Quotient Property of Radicals",
     "definition": "√(a/b) = √a ÷ √b, for nonnegative a and positive b.",
     "topic": "Multiplying & Dividing Radicals"
    },
    {
     "term": "Rationalizing the denominator",
     "definition": "Rewriting a fraction so that no radical remains on the bottom.",
     "topic": "Multiplying & Dividing Radicals"
    },
    {
     "term": "Conjugate",
     "definition": "The binomial with the opposite middle sign, such as 3 − √2 for 3 + √2; used to clear radicals from denominators.",
     "topic": "Multiplying & Dividing Radicals"
    },
    {
     "term": "Like radicals",
     "definition": "Radical expressions that share the same index and the same radicand.",
     "topic": "Adding & Subtracting Radicals"
    },
    {
     "term": "Coefficient (of a radical)",
     "definition": "The number multiplied in front of a radical expression.",
     "topic": "Adding & Subtracting Radicals"
    },
    {
     "term": "Rational number",
     "definition": "A number that can be written as a/b, where a and b are integers and b ≠ 0.",
     "topic": "Rational vs Irrational Numbers"
    },
    {
     "term": "Irrational number",
     "definition": "A number whose decimal form never ends or repeats, so it cannot be written as a fraction of integers.",
     "topic": "Rational vs Irrational Numbers"
    },
    {
     "term": "Real number",
     "definition": "Any number that is either rational or irrational.",
     "topic": "Rational vs Irrational Numbers"
    },
    {
     "term": "Pythagorean theorem",
     "definition": "a² + b² = c², relating the two legs and hypotenuse of a right triangle.",
     "topic": "Pythagorean Theorem"
    },
    {
     "term": "Hypotenuse",
     "definition": "The longest side of a right triangle, located opposite the right angle.",
     "topic": "Pythagorean Theorem"
    },
    {
     "term": "Legs (of a right triangle)",
     "definition": "The two shorter sides of a right triangle, meeting at the right angle.",
     "topic": "Pythagorean Theorem"
    },
    {
     "term": "Converse of the Pythagorean theorem",
     "definition": "If a triangle's sides satisfy a² + b² = c², the triangle must have a right angle.",
     "topic": "Pythagorean Theorem"
    },
    {
     "term": "Distance formula",
     "definition": "d = √((x₂ − x₁)² + (y₂ − y₁)²), used to find the distance between two points on a coordinate plane.",
     "topic": "Pythagorean Theorem"
    }
   ],
   "questions": [
    {
     "id": "alg1-u11-q1",
     "type": "mc",
     "prompt": "What is √49?",
     "options": [
      "7",
      "24.5",
      "14",
      "49"
     ],
     "answer": "7",
     "explanation": "Since 7 × 7 = 49, the square root of 49 is 7.",
     "topic": "Square Roots & Perfect Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q2",
     "type": "mc",
     "prompt": "Which of the following is a perfect square?",
     "options": [
      "48",
      "64",
      "72",
      "90"
     ],
     "answer": "64",
     "explanation": "64 = 8 × 8, so it is a perfect square. 48, 72, and 90 are not the product of any integer multiplied by itself.",
     "topic": "Square Roots & Perfect Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q3",
     "type": "mc",
     "prompt": "What is the principal square root of 81?",
     "options": [
      "9",
      "−9",
      "±9",
      "40.5"
     ],
     "answer": "9",
     "explanation": "The principal square root is always the nonnegative root. Since 9 × 9 = 81, √81 = 9, not −9 or ±9.",
     "topic": "Principal Square Root",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q4",
     "type": "mc",
     "prompt": "What are all the solutions of the equation x² = 36?",
     "options": [
      "x = 6 or x = −6",
      "x = 6 or x = 0",
      "x = 18 or x = −18",
      "x = 36 or x = −36"
     ],
     "answer": "x = 6 or x = −6",
     "explanation": "Both 6² = 36 and (−6)² = 36, so x = ±√36 = ±6. The radical √36 alone means only the principal root 6, but the equation x² = 36 has two solutions.",
     "topic": "Principal Square Root",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q5",
     "type": "mc",
     "prompt": "What is √50 written in simplified radical form?",
     "options": [
      "5√2",
      "2√5",
      "10√5",
      "25√2"
     ],
     "answer": "5√2",
     "explanation": "50 = 25 · 2, and 25 is a perfect square, so √50 = √25 · √2 = 5√2. Check: (5√2)² = 25 · 2 = 50.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q6",
     "type": "mc",
     "prompt": "What is √48 written in simplified radical form?",
     "options": [
      "4√3",
      "3√4",
      "12√3",
      "4√12"
     ],
     "answer": "4√3",
     "explanation": "48 = 16 · 3, and 16 is a perfect square, so √48 = √16 · √3 = 4√3. Check: (4√3)² = 16 · 3 = 48.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q7",
     "type": "mc",
     "prompt": "What is √3 · √12?",
     "options": [
      "6",
      "√15",
      "36",
      "15"
     ],
     "answer": "6",
     "explanation": "By the product property, √3 · √12 = √(3 × 12) = √36 = 6.",
     "topic": "Multiplying & Dividing Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q8",
     "type": "mc",
     "prompt": "What is √50 ÷ √2?",
     "options": [
      "5",
      "25",
      "√48",
      "10"
     ],
     "answer": "5",
     "explanation": "By the quotient property, √50 ÷ √2 = √(50 ÷ 2) = √25 = 5.",
     "topic": "Multiplying & Dividing Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q9",
     "type": "mc",
     "prompt": "What is (√6)(√10) in simplified radical form?",
     "options": [
      "2√15",
      "2√30",
      "4√15",
      "60"
     ],
     "answer": "2√15",
     "explanation": "√6 · √10 = √60 = √(4 × 15) = 2√15. Check: (2√15)² = 4 × 15 = 60, and 6 × 10 = 60, so it matches.",
     "topic": "Multiplying & Dividing Radicals",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u11-q10",
     "type": "mc",
     "prompt": "What is 3√2 + 5√2?",
     "options": [
      "8√2",
      "8√4",
      "15√2",
      "8"
     ],
     "answer": "8√2",
     "explanation": "3√2 and 5√2 are like radicals, so add their coefficients: 3√2 + 5√2 = (3 + 5)√2 = 8√2.",
     "topic": "Adding & Subtracting Radicals",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q11",
     "type": "mc",
     "prompt": "What is √18 + √8 written as a single simplified radical?",
     "options": [
      "5√2",
      "√26",
      "6√2",
      "10√2"
     ],
     "answer": "5√2",
     "explanation": "√18 = 3√2 and √8 = 2√2, so √18 + √8 = 3√2 + 2√2 = 5√2. Check: 3√2 ≈ 4.243 and 2√2 ≈ 2.828, and their sum ≈ 7.071, which matches 5√2 ≈ 7.071.",
     "topic": "Adding & Subtracting Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q12",
     "type": "mc",
     "prompt": "What is 7√5 − 2√5?",
     "options": [
      "5√5",
      "5",
      "9√5",
      "5√10"
     ],
     "answer": "5√5",
     "explanation": "These are like radicals, so subtract the coefficients: 7√5 − 2√5 = (7 − 2)√5 = 5√5.",
     "topic": "Adding & Subtracting Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q13",
     "type": "mc",
     "prompt": "Which of these is an irrational number?",
     "options": [
      "√16",
      "√25",
      "√10",
      "√49"
     ],
     "answer": "√10",
     "explanation": "10 is not a perfect square, so √10 is a non-terminating, non-repeating decimal, making it irrational. √16 = 4, √25 = 5, and √49 = 7 are all whole (rational) numbers.",
     "topic": "Rational vs Irrational Numbers",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q14",
     "type": "mc",
     "prompt": "Which statement correctly classifies √9 + √16?",
     "options": [
      "Rational, because it simplifies to a whole number",
      "Irrational, because it contains radicals",
      "Rational, because all square roots are rational",
      "Irrational, because 9 and 16 are not perfect squares"
     ],
     "answer": "Rational, because it simplifies to a whole number",
     "explanation": "√9 = 3 and √16 = 4, so √9 + √16 = 3 + 4 = 7, which is a whole number and therefore rational.",
     "topic": "Rational vs Irrational Numbers",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q15",
     "type": "mc",
     "prompt": "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
     "options": [
      "10",
      "14",
      "48",
      "100"
     ],
     "answer": "10",
     "explanation": "By the Pythagorean theorem, c = √(6² + 8²) = √(36 + 64) = √100 = 10.",
     "topic": "Pythagorean Theorem",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q16",
     "type": "mc",
     "prompt": "A 13-foot ladder leans against a wall with its base 5 feet from the wall. How high up the wall does the ladder reach?",
     "options": [
      "12",
      "14",
      "8",
      "18"
     ],
     "answer": "12",
     "explanation": "Using a² + b² = c², the height is √(13² − 5²) = √(169 − 25) = √144 = 12 feet.",
     "topic": "Pythagorean Theorem",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q17",
     "type": "tf",
     "prompt": "169 is a perfect square.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "13 × 13 = 169, so 169 is an integer multiplied by itself, which makes it a perfect square.",
     "topic": "Square Roots & Perfect Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q18",
     "type": "tf",
     "prompt": "50 is a perfect square.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The nearest perfect squares are 49 (7²) and 64 (8²); no integer multiplied by itself equals 50.",
     "topic": "Square Roots & Perfect Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q19",
     "type": "tf",
     "prompt": "The principal square root of 100 is 10.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since 10 × 10 = 100, and the principal root is the nonnegative one, √100 = 10.",
     "topic": "Principal Square Root",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q20",
     "type": "tf",
     "prompt": "The principal square root of 25 is −5.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The principal square root is always nonnegative, so √25 = 5, not −5, even though (−5)² = 25 as well.",
     "topic": "Principal Square Root",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q21",
     "type": "tf",
     "prompt": "√75 simplifies to 5√3.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "75 = 25 × 3, and 25 is a perfect square, so √75 = √25 · √3 = 5√3. Check: 5√3 ≈ 8.660, and √75 ≈ 8.660.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q22",
     "type": "tf",
     "prompt": "4√3 + 2√3 = 6√6.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "When adding like radicals, only the coefficients combine and the radicand stays the same: 4√3 + 2√3 = 6√3, not 6√6.",
     "topic": "Adding & Subtracting Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q23",
     "type": "tf",
     "prompt": "√17 is an irrational number.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "17 is not a perfect square, so its square root is a non-terminating, non-repeating decimal, which makes it irrational.",
     "topic": "Rational vs Irrational Numbers",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q24",
     "type": "tf",
     "prompt": "In a right triangle with legs 5 and 12, the hypotenuse is 17.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "By the Pythagorean theorem, c = √(5² + 12²) = √(25 + 144) = √169 = 13, not 17 (17 is just 5 + 12 added directly, which is incorrect).",
     "topic": "Pythagorean Theorem",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q25",
     "type": "written",
     "prompt": "What is √121?",
     "answer": "11",
     "accept": [],
     "explanation": "11 × 11 = 121, so √121 = 11.",
     "topic": "Square Roots & Perfect Squares",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q26",
     "type": "written",
     "prompt": "What is the principal square root of 144?",
     "answer": "12",
     "accept": [],
     "explanation": "12 × 12 = 144, and the principal square root is the nonnegative one, so √144 = 12.",
     "topic": "Principal Square Root",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q27",
     "type": "written",
     "prompt": "When √200 is written in simplified form as a√2, what is the value of a?",
     "answer": "10",
     "accept": [
      "a=10",
      "a = 10"
     ],
     "explanation": "200 = 100 × 2, and 100 is a perfect square, so √200 = √100 · √2 = 10√2, meaning a = 10.",
     "topic": "Simplifying Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q28",
     "type": "written",
     "prompt": "What is √5 · √20?",
     "answer": "10",
     "accept": [],
     "explanation": "By the product property, √5 · √20 = √(5 × 20) = √100 = 10.",
     "topic": "Multiplying & Dividing Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q29",
     "type": "written",
     "prompt": "When 5√3 + 5√3 is simplified to the form c√3, what is the value of c?",
     "answer": "10",
     "accept": [
      "c=10",
      "c = 10"
     ],
     "explanation": "Adding the coefficients of these like radicals gives 5 + 5 = 10, so 5√3 + 5√3 = 10√3, meaning c = 10.",
     "topic": "Adding & Subtracting Radicals",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u11-q30",
     "type": "tf",
     "prompt": "√36 is an irrational number.",
     "answer": "False",
     "accept": [],
     "explanation": "√36 = 6, which is a whole number, so it can be written as a ratio of integers (6/1), making it rational.",
     "topic": "Rational vs Irrational Numbers",
     "difficulty": "easy",
     "options": [
      "True",
      "False"
     ]
    },
    {
     "id": "alg1-u11-q31",
     "type": "written",
     "prompt": "A right triangle has legs of length 9 and 12. What is the length of the hypotenuse?",
     "answer": "15",
     "accept": [
      "c=15",
      "c = 15",
      "15 units",
      "15.0"
     ],
     "explanation": "By the Pythagorean theorem, c = √(9² + 12²) = √(81 + 144) = √225 = 15.",
     "topic": "Pythagorean Theorem",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u11-q32",
     "type": "written",
     "prompt": "Using the distance formula, find the distance between the points (1, 2) and (4, 6).",
     "answer": "5",
     "accept": [
      "d=5",
      "d = 5",
      "5 units",
      "5.0"
     ],
     "explanation": "d = √((4 − 1)² + (6 − 2)²) = √(3² + 4²) = √(9 + 16) = √25 = 5. This is the Pythagorean theorem applied to legs of 3 and 4.",
     "topic": "Pythagorean Theorem",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u12",
   "unit": 12,
   "title": "Data and Statistics",
   "summary": "Learn to summarize data sets using mean, median, mode, range, quartiles, and box plots, then spot and describe outliers, skew, and shape in dot plots and histograms. Analyze relationships between two variables with scatter plots, correlation, lines of best fit, and two-way frequency tables — and learn why correlation isn't causation.",
   "topics": [
    "Center and Spread",
    "Quartiles and Box Plots",
    "Displaying Data",
    "Scatter Plots and Correlation",
    "Two-Way Frequency Tables"
   ],
   "terms": [
    {
     "term": "Mean",
     "definition": "The sum of a data set divided by the number of values.",
     "topic": "Center and Spread"
    },
    {
     "term": "Median",
     "definition": "The middle value of an ordered data set, or the average of the two middle values.",
     "topic": "Center and Spread"
    },
    {
     "term": "Mode",
     "definition": "The value or values that occur most frequently in a data set.",
     "topic": "Center and Spread"
    },
    {
     "term": "Range",
     "definition": "The difference between the maximum and minimum values in a data set.",
     "topic": "Center and Spread"
    },
    {
     "term": "Measure of central tendency",
     "definition": "A value that describes the typical or middle value of a data set, such as mean or median.",
     "topic": "Center and Spread"
    },
    {
     "term": "Quartile",
     "definition": "One of three values that divide an ordered data set into four equal parts.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "First quartile (Q1)",
     "definition": "The median of the lower half of an ordered data set.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Third quartile (Q3)",
     "definition": "The median of the upper half of an ordered data set.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Interquartile range (IQR)",
     "definition": "The difference between the third and first quartiles: Q3 − Q1.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Five-number summary",
     "definition": "The minimum, first quartile, median, third quartile, and maximum of a data set.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Box plot",
     "definition": "A graph displaying a data set's five-number summary using a box and two whiskers.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Outlier",
     "definition": "A value far from the rest of the data; often below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.",
     "topic": "Quartiles and Box Plots"
    },
    {
     "term": "Dot plot",
     "definition": "A graph showing individual data values as dots stacked above a number line.",
     "topic": "Displaying Data"
    },
    {
     "term": "Histogram",
     "definition": "A bar graph showing frequencies of numerical data grouped into equal intervals.",
     "topic": "Displaying Data"
    },
    {
     "term": "Frequency",
     "definition": "The number of times a value or range of values occurs in a data set.",
     "topic": "Displaying Data"
    },
    {
     "term": "Skewed distribution",
     "definition": "A distribution with data stretched farther toward one side of its peak than the other.",
     "topic": "Displaying Data"
    },
    {
     "term": "Scatter plot",
     "definition": "A graph of paired numerical data shown as points on a coordinate plane.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Positive correlation",
     "definition": "A pattern in which one variable tends to increase as the other increases.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Negative correlation",
     "definition": "A pattern in which one variable tends to increase as the other decreases.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "No correlation",
     "definition": "The absence of a clear linear pattern between two variables in a scatter plot.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Correlation coefficient (r)",
     "definition": "A number from −1 to 1 measuring the strength and direction of a linear relationship.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Line of best fit",
     "definition": "A straight line that best models the trend in a set of paired data.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Correlation vs causation",
     "definition": "The principle that a relationship between two variables does not prove one causes the other.",
     "topic": "Scatter Plots and Correlation"
    },
    {
     "term": "Two-way frequency table",
     "definition": "A table showing counts of data organized by two categorical variables at once.",
     "topic": "Two-Way Frequency Tables"
    },
    {
     "term": "Joint frequency",
     "definition": "A count in a two-way table showing how often two specific categories occur together.",
     "topic": "Two-Way Frequency Tables"
    },
    {
     "term": "Marginal frequency",
     "definition": "A row or column total in a two-way frequency table.",
     "topic": "Two-Way Frequency Tables"
    }
   ],
   "questions": [
    {
     "id": "alg1-u12-q1",
     "type": "mc",
     "prompt": "What is the mean of the data set 4, 8, 6, 10, 12?",
     "options": [
      "8",
      "6",
      "10",
      "40"
     ],
     "answer": "8",
     "explanation": "Add all values: 4+8+6+10+12 = 40. Divide by the 5 data values: 40 ÷ 5 = 8.",
     "topic": "Center and Spread",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q2",
     "type": "mc",
     "prompt": "What is the median of the data set 2, 9, 3, 7, 5?",
     "options": [
      "5",
      "3",
      "7",
      "2"
     ],
     "answer": "5",
     "explanation": "Order the values: 2, 3, 5, 7, 9. With 5 values, the median is the middle (3rd) value, which is 5.",
     "topic": "Center and Spread",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q3",
     "type": "written",
     "prompt": "Find the mode of the data set: 2, 3, 3, 5, 7, 3, 8.",
     "answer": "3",
     "accept": [],
     "explanation": "The value 3 appears three times, more often than any other value, so 3 is the mode.",
     "topic": "Center and Spread",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q4",
     "type": "tf",
     "prompt": "The range of the data set 10, 2, 8, 15, 6 is 13.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Range = maximum − minimum = 15 − 2 = 13, so the statement is true.",
     "topic": "Center and Spread",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q5",
     "type": "mc",
     "prompt": "A bowler's scores for 5 games are 150, 162, 150, 178, 165. Which measure of center equals 150?",
     "options": [
      "Mode",
      "Mean",
      "Median",
      "Range"
     ],
     "answer": "Mode",
     "explanation": "150 occurs twice, more often than any other score, so 150 is the mode. (The mean is 805÷5 = 161 and the median, from ordered scores 150,150,162,165,178, is 162.)",
     "topic": "Center and Spread",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q6",
     "type": "mc",
     "prompt": "Which measure of center is most affected by adding one very large outlier to a data set?",
     "options": [
      "Mean",
      "Median",
      "Mode",
      "All are affected equally"
     ],
     "answer": "Mean",
     "explanation": "The mean uses every value in its sum, so one extreme value pulls it up or down. The median depends only on the middle value(s), and the mode depends only on repeated values, so both resist outliers.",
     "topic": "Center and Spread",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q7",
     "type": "mc",
     "prompt": "In a five-number summary, which value has about 25% of the data below it and about 75% above it?",
     "options": [
      "Q1",
      "Q2",
      "Q3",
      "Minimum"
     ],
     "answer": "Q1",
     "explanation": "Q1, the first quartile, is the median of the lower half of the data. About one quarter of the values fall below it and three quarters fall above it.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q8",
     "type": "written",
     "prompt": "Find the interquartile range (IQR) of the ordered data set: 4, 8, 15, 16, 23, 42.",
     "answer": "15",
     "accept": [],
     "explanation": "The lower half {4,8,15} has median Q1 = 8. The upper half {16,23,42} has median Q3 = 23. IQR = Q3 − Q1 = 23 − 8 = 15.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q9",
     "type": "mc",
     "prompt": "A data set has Q1 = 20 and Q3 = 32. Using the 1.5×IQR rule, which of these values would count as a low outlier?",
     "options": [
      "0",
      "5",
      "10",
      "15"
     ],
     "answer": "0",
     "explanation": "IQR = 32 − 20 = 12, so 1.5×IQR = 18. The lower fence is 20 − 18 = 2; any value below 2, such as 0, is a low outlier.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u12-q10",
     "type": "tf",
     "prompt": "In a box plot, the box itself represents the middle 50% of the data.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The box stretches from Q1 to Q3, and by definition the interquartile range contains the middle 50% of the data.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q11",
     "type": "mc",
     "prompt": "In a box plot, what do the whiskers represent?",
     "options": [
      "The spread from the minimum to Q1 and from Q3 to the maximum",
      "The spread from Q1 to the median and from the median to Q3",
      "The spread from the mean to Q1 and from the mean to Q3",
      "The spread of the middle 50% of the data, from Q1 to Q3"
     ],
     "answer": "The spread from the minimum to Q1 and from Q3 to the maximum",
     "explanation": "The box covers Q1 to Q3. The whiskers extend from the ends of the box out to the minimum and maximum, showing the lowest 25% and highest 25% of the data.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q12",
     "type": "written",
     "prompt": "Find the median of the data set: 12, 5, 9, 20, 7, 16.",
     "answer": "10.5",
     "accept": [
      "21/2",
      "10 1/2",
      "10½"
     ],
     "explanation": "Order the values: 5, 7, 9, 12, 16, 20. With 6 values, the median is the average of the 3rd and 4th values: (9 + 12) ÷ 2 = 21 ÷ 2 = 10.5.",
     "topic": "Center and Spread",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q13",
     "type": "mc",
     "prompt": "Which graph groups numerical data into equal-width intervals and shows bars with no gaps between them?",
     "options": [
      "Histogram",
      "Dot plot",
      "Scatter plot",
      "Box plot"
     ],
     "answer": "Histogram",
     "explanation": "A histogram groups continuous data into equal intervals (bins) and draws touching bars to show frequency in each interval.",
     "topic": "Displaying Data",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q14",
     "type": "mc",
     "prompt": "Which graph displays each individual data value as a dot stacked above a number line?",
     "options": [
      "Dot plot",
      "Histogram",
      "Two-way table",
      "Scatter plot"
     ],
     "answer": "Dot plot",
     "explanation": "A dot plot places one dot above its value on a number line for every data point, with stacks showing repeated values.",
     "topic": "Displaying Data",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q15",
     "type": "tf",
     "prompt": "A distribution with a long tail stretching toward the higher values is called left-skewed.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A distribution with a long tail toward the higher (right side) values is called right-skewed, not left-skewed.",
     "topic": "Displaying Data",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q16",
     "type": "mc",
     "prompt": "A histogram of test scores has a tall bar for 80–89, a medium bar for 70–79, a short bar for 60–69, and several small bars stretching down to 20–29. Which best describes the shape?",
     "options": [
      "Left-skewed",
      "Right-skewed",
      "Symmetric",
      "Uniform"
     ],
     "answer": "Left-skewed",
     "explanation": "Most scores cluster high (70s–80s), with a long tail stretching toward the low scores. A distribution whose tail points toward the lower values is left-skewed.",
     "topic": "Displaying Data",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q17",
     "type": "mc",
     "prompt": "A scatter plot shows that as hours studied increases, test scores also tend to increase. This is an example of:",
     "options": [
      "Positive correlation",
      "Negative correlation",
      "No correlation",
      "Causation"
     ],
     "answer": "Positive correlation",
     "explanation": "Both variables increase together, which is the pattern of a positive correlation.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q18",
     "type": "mc",
     "prompt": "A scatter plot shows that as a car's age increases, its resale value tends to decrease. This is an example of:",
     "options": [
      "Negative correlation",
      "Positive correlation",
      "No correlation",
      "Causation"
     ],
     "answer": "Negative correlation",
     "explanation": "One variable increases while the other decreases, which is the pattern of a negative correlation.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q19",
     "type": "mc",
     "prompt": "Which correlation coefficient r represents the strongest linear relationship?",
     "options": [
      "r = −0.95",
      "r = 0.5",
      "r = 0.1",
      "r = −0.2"
     ],
     "answer": "r = −0.95",
     "explanation": "Strength of correlation depends on how close |r| is to 1, not its sign; |−0.95| = 0.95 is the closest to 1 among the choices, so it shows the strongest linear relationship.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q20",
     "type": "tf",
     "prompt": "A correlation coefficient of r = 0 means there is a strong negative linear relationship between the variables.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "r = 0 indicates no linear relationship between the variables; a strong negative relationship would instead have r close to −1.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q21",
     "type": "written",
     "prompt": "A line of best fit is given by y = 3x + 5. What is the predicted y-value when x = 4?",
     "answer": "17",
     "accept": [
      "y=17",
      "y = 17",
      "17.0"
     ],
     "explanation": "Substitute x = 4: y = 3(4) + 5 = 12 + 5 = 17.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q22",
     "type": "mc",
     "prompt": "A scatter plot of hours worked (x) and pay in dollars (y) has a line of best fit passing through (0, 10) and (5, 60). What is the equation of the line of best fit?",
     "options": [
      "y = 10x + 10",
      "y = 50x + 10",
      "y = 10x + 5",
      "y = 5x + 10"
     ],
     "answer": "y = 10x + 10",
     "explanation": "Slope = (60 − 10)/(5 − 0) = 50/5 = 10. Using (0, 10) as the y-intercept gives y = 10x + 10; checking x = 5: y = 10(5)+10 = 60, which matches.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u12-q23",
     "type": "tf",
     "prompt": "Ice cream sales and drowning incidents both increase in summer, but this does not mean ice cream sales cause drownings.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Both are driven by a third factor, hot weather, illustrating that correlation between two variables does not prove one causes the other.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q24",
     "type": "mc",
     "prompt": "A study finds that fires with more fire trucks at the scene tend to cause more damage. What is the most likely explanation?",
     "options": [
      "Bigger fires bring more trucks and also cause more damage",
      "The fire trucks themselves are what cause the extra damage",
      "Sending fewer trucks to each fire would reduce the damage",
      "The number of trucks and the damage are not related at all"
     ],
     "answer": "Bigger fires bring more trucks and also cause more damage",
     "explanation": "Fire size is a lurking variable: bigger fires need more trucks and also cause more damage. The correlation is real, but it does not mean the trucks cause the damage.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u12-q25",
     "type": "mc",
     "prompt": "In a two-way frequency table, a count found at a specific row-and-column intersection (not a total) is called a:",
     "options": [
      "Joint frequency",
      "Marginal frequency",
      "Conditional frequency",
      "Cumulative frequency"
     ],
     "answer": "Joint frequency",
     "explanation": "A joint frequency is the count where one specific row category and one specific column category overlap. Row and column totals are marginal frequencies.",
     "topic": "Two-Way Frequency Tables",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u12-q26",
     "type": "mc",
     "prompt": "Of 50 students surveyed, 30 play a sport, 20 play an instrument, and 10 do both. How many students do neither?",
     "options": [
      "10",
      "20",
      "0",
      "40"
     ],
     "answer": "10",
     "explanation": "Students doing at least one activity = 30 + 20 − 10 (counted twice) = 40. Neither = 50 − 40 = 10.",
     "topic": "Two-Way Frequency Tables",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q27",
     "type": "written",
     "prompt": "A two-way table of 50 students shows: 18 boys like pizza, 7 boys dislike pizza, 15 girls like pizza, and 10 girls dislike pizza. What is the marginal (row) total for boys?",
     "answer": "25",
     "accept": [],
     "explanation": "Add the boys' joint frequencies across both columns: 18 (like) + 7 (dislike) = 25.",
     "topic": "Two-Way Frequency Tables",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q28",
     "type": "tf",
     "prompt": "A marginal frequency is the same thing as a joint frequency in a two-way table.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A marginal frequency is a row or column total, while a joint frequency is a single count at the intersection of one row and one column; they are different.",
     "topic": "Two-Way Frequency Tables",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q29",
     "type": "written",
     "prompt": "If 5 is added to every value in the data set 45, 38, 52, 41, 60, 33, what is the range of the new data set?",
     "answer": "27",
     "accept": [
      "27.0"
     ],
     "explanation": "The new values are 50, 43, 57, 46, 65, 38, so the range is 65 − 38 = 27. That equals the original range (60 − 33 = 27), because adding a constant shifts every value but does not change the spread.",
     "topic": "Center and Spread",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q30",
     "type": "mc",
     "prompt": "A box plot has minimum = 10, Q1 = 18, median = 25, Q3 = 34, maximum = 50. What is the interquartile range?",
     "options": [
      "16",
      "24",
      "40",
      "9"
     ],
     "answer": "16",
     "explanation": "IQR = Q3 − Q1 = 34 − 18 = 16.",
     "topic": "Quartiles and Box Plots",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u12-q31",
     "type": "written",
     "prompt": "Five test scores have a mean of 84. Four of the scores are 80, 90, 75, and 88. What is the fifth score?",
     "answer": "87",
     "accept": [],
     "explanation": "Total of 5 scores = 84 × 5 = 420. Sum of the four known scores = 80+90+75+88 = 333. Fifth score = 420 − 333 = 87.",
     "topic": "Center and Spread",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u12-q32",
     "type": "tf",
     "prompt": "A scatter plot with points scattered randomly and no visible pattern shows no correlation.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "When there is no linear pattern connecting the two variables, the scatter plot shows no correlation.",
     "topic": "Scatter Plots and Correlation",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "alg1-u13",
   "unit": 13,
   "title": "Function Families and Transformations",
   "summary": "Explore the shapes of parent functions — linear, quadratic, absolute value, square root, and exponential — and see how shifts, reflections, and stretches transform their graphs. Learn to evaluate piecewise and step functions, compare linear, quadratic, and exponential growth patterns, and read domain, range, and average rate of change from a graph.",
   "topics": [
    "Parent Functions",
    "Transformations",
    "Absolute Value Functions",
    "Piecewise & Step Functions",
    "Domain and Range",
    "Comparing Models & Rate of Change"
   ],
   "terms": [
    {
     "term": "Parent function",
     "definition": "The simplest function of its type; every other function in that family is a transformation of it.",
     "topic": "Parent Functions"
    },
    {
     "term": "Linear parent function",
     "definition": "y = x, a straight line through the origin with slope 1.",
     "topic": "Parent Functions"
    },
    {
     "term": "Quadratic parent function",
     "definition": "y = x², a U-shaped parabola with vertex at the origin.",
     "topic": "Parent Functions"
    },
    {
     "term": "Absolute value parent function",
     "definition": "y = |x|, a V-shaped graph with vertex at the origin.",
     "topic": "Parent Functions"
    },
    {
     "term": "Square root parent function",
     "definition": "y = √x, a curve starting at the origin, defined only for x ≥ 0.",
     "topic": "Parent Functions"
    },
    {
     "term": "Exponential parent function",
     "definition": "y = bˣ, where b > 0 and b ≠ 1, a curve that grows or decays by a constant ratio.",
     "topic": "Parent Functions"
    },
    {
     "term": "Vertical translation",
     "definition": "A shift of a graph up or down, produced by f(x) + k.",
     "topic": "Transformations"
    },
    {
     "term": "Horizontal translation",
     "definition": "A shift of a graph left or right, produced by f(x − h).",
     "topic": "Transformations"
    },
    {
     "term": "Reflection over the x-axis",
     "definition": "A flip of a graph upside down, produced by −f(x).",
     "topic": "Transformations"
    },
    {
     "term": "Vertical stretch",
     "definition": "a·f(x) with |a| > 1: y-values are multiplied by a, pulling the graph away from the x-axis.",
     "topic": "Transformations"
    },
    {
     "term": "Vertical shrink",
     "definition": "A transformation that makes a graph wider or flatter, from a·f(x) when 0 < |a| < 1.",
     "topic": "Transformations"
    },
    {
     "term": "Vertex form",
     "definition": "An equation written as y = a(x − h)² + k, which shows a function's transformations directly.",
     "topic": "Transformations"
    },
    {
     "term": "Vertex (absolute value function)",
     "definition": "The point (h, k) where the graph of y = a|x − h| + k changes direction.",
     "topic": "Absolute Value Functions"
    },
    {
     "term": "Axis of symmetry",
     "definition": "The vertical line through the vertex, x = h, across which the graph is a mirror image.",
     "topic": "Absolute Value Functions"
    },
    {
     "term": "Piecewise function",
     "definition": "A function built from different rules, each applying over a specific interval of the domain.",
     "topic": "Piecewise & Step Functions"
    },
    {
     "term": "Step function",
     "definition": "A piecewise function that is constant on intervals, so its graph looks like a staircase of horizontal segments.",
     "topic": "Piecewise & Step Functions"
    },
    {
     "term": "Greatest integer function",
     "definition": "f(x) = ⌊x⌋: rounds x down to the nearest integer at or below x (for example, ⌊4.7⌋ = 4 and ⌊−2.3⌋ = −3).",
     "topic": "Piecewise & Step Functions"
    },
    {
     "term": "Domain",
     "definition": "The complete set of possible input (x) values of a function.",
     "topic": "Domain and Range"
    },
    {
     "term": "Range",
     "definition": "The complete set of possible output (y) values of a function.",
     "topic": "Domain and Range"
    },
    {
     "term": "Constant difference",
     "definition": "When consecutive table outputs change by the same added amount, a sign of a linear pattern.",
     "topic": "Comparing Models & Rate of Change"
    },
    {
     "term": "Constant ratio",
     "definition": "When consecutive table outputs are multiplied by the same factor, a sign of an exponential pattern.",
     "topic": "Comparing Models & Rate of Change"
    },
    {
     "term": "Average rate of change",
     "definition": "The slope between two points on a graph; change in output divided by change in input over an interval.",
     "topic": "Comparing Models & Rate of Change"
    },
    {
     "term": "Exponential growth",
     "definition": "A pattern where a quantity is repeatedly multiplied by a factor greater than 1 over equal intervals.",
     "topic": "Comparing Models & Rate of Change"
    },
    {
     "term": "Exponential decay",
     "definition": "A pattern where a quantity is repeatedly multiplied by a factor between 0 and 1 over equal intervals.",
     "topic": "Comparing Models & Rate of Change"
    }
   ],
   "questions": [
    {
     "id": "alg1-u13-q1",
     "type": "mc",
     "prompt": "Which parent function's graph is V-shaped, with its vertex at the origin?",
     "options": [
      "y = |x|",
      "y = x²",
      "y = √x",
      "y = x"
     ],
     "answer": "y = |x|",
     "explanation": "The absolute value parent function y = |x| equals x for x ≥ 0 and −x for x < 0, meeting at the vertex (0, 0) to form a V-shape.",
     "topic": "Parent Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q2",
     "type": "mc",
     "prompt": "Which parent function's graph is a U-shaped parabola with vertex at the origin?",
     "options": [
      "y = x²",
      "y = |x|",
      "y = x",
      "y = √x"
     ],
     "answer": "y = x²",
     "explanation": "The quadratic parent function y = x² produces a parabola opening upward with its lowest point (vertex) at (0, 0).",
     "topic": "Parent Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q3",
     "type": "tf",
     "prompt": "True or False: The parent function y = √x is defined for all real numbers x.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A square root of a negative number is not real, so y = √x is only defined for x ≥ 0.",
     "topic": "Parent Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q4",
     "type": "mc",
     "prompt": "Which parent function has a domain restricted to x ≥ 0?",
     "options": [
      "y = √x",
      "y = x²",
      "y = |x|",
      "y = 2ˣ"
     ],
     "answer": "y = √x",
     "explanation": "y = √x requires a nonnegative value under the radical, so its domain is x ≥ 0, unlike the other listed parent functions, which allow all real x.",
     "topic": "Parent Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q5",
     "type": "mc",
     "prompt": "For the exponential parent function y = bˣ with b > 1, what happens to y as x increases?",
     "options": [
      "y increases without bound",
      "y decreases toward 0",
      "y stays constant",
      "y decreases without bound"
     ],
     "answer": "y increases without bound",
     "explanation": "When the base b is greater than 1, each unit increase in x multiplies y by b, so y grows larger as x increases.",
     "topic": "Parent Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q6",
     "type": "written",
     "prompt": "Write the equation of the linear parent function in the form y = ...",
     "answer": "y = x",
     "accept": [
      "y=x",
      "x"
     ],
     "explanation": "The linear parent function is the simplest line, passing through the origin with slope 1, written as y = x.",
     "topic": "Parent Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q7",
     "type": "mc",
     "prompt": "The graph of g(x) = f(x) + 3 is the graph of f(x) shifted:",
     "options": [
      "up 3 units",
      "down 3 units",
      "left 3 units",
      "right 3 units"
     ],
     "answer": "up 3 units",
     "explanation": "Adding a constant outside the function, f(x) + k, moves the graph vertically; since k = 3 is positive, the shift is up 3 units.",
     "topic": "Transformations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q8",
     "type": "mc",
     "prompt": "The graph of g(x) = f(x − 5) is the graph of f(x) shifted:",
     "options": [
      "right 5 units",
      "left 5 units",
      "up 5 units",
      "down 5 units"
     ],
     "answer": "right 5 units",
     "explanation": "Subtracting inside the parentheses, f(x − h), shifts the graph horizontally right by h units; here h = 5.",
     "topic": "Transformations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q9",
     "type": "tf",
     "prompt": "True or False: The graph of g(x) = f(x) − 4 is the graph of f(x) shifted down 4 units.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Adding a constant k = −4 outside the function moves the whole graph down 4 units.",
     "topic": "Transformations",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q10",
     "type": "tf",
     "prompt": "True or False: In g(x) = f(x + 2), the graph of f(x) is shifted right 2 units.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "f(x + 2) matches f(x − h) with h = −2, which shifts the graph left 2 units, not right.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q11",
     "type": "mc",
     "prompt": "Which transformation reflects the graph of f(x) over the x-axis?",
     "options": [
      "−f(x)",
      "f(x − 1)",
      "2f(x)",
      "f(x) + 1"
     ],
     "answer": "−f(x)",
     "explanation": "Multiplying the entire output by −1 flips every point (x, y) to (x, −y), which is a reflection over the x-axis.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q12",
     "type": "mc",
     "prompt": "If g(x) = 3·f(x), the graph of g is a vertical ______ of f by a factor of 3.",
     "options": [
      "stretch",
      "shrink",
      "translation",
      "reflection"
     ],
     "answer": "stretch",
     "explanation": "Since |a| = 3 is greater than 1 in a·f(x), every y-value triples, stretching the graph vertically away from the x-axis.",
     "topic": "Transformations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q13",
     "type": "mc",
     "prompt": "The graph of f(x) = x² is transformed to g(x) = ½·x². Compared to f, the graph of g is:",
     "options": [
      "vertically shrunk (wider/flatter)",
      "vertically stretched (narrower)",
      "shifted up ½ unit",
      "reflected over the x-axis"
     ],
     "answer": "vertically shrunk (wider/flatter)",
     "explanation": "Since a = ½ satisfies 0 < |a| < 1 in a·f(x), every y-value is halved, flattening the parabola — a vertical shrink.",
     "topic": "Transformations",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u13-q14",
     "type": "mc",
     "prompt": "For y = a|x − h| + k, the vertex of the graph is located at:",
     "options": [
      "(h, k)",
      "(−h, k)",
      "(h, −k)",
      "(k, h)"
     ],
     "answer": "(h, k)",
     "explanation": "The graph's turning point occurs where x − h = 0, giving x = h and y = k, so the vertex is (h, k).",
     "topic": "Absolute Value Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q15",
     "type": "mc",
     "prompt": "What is the vertex of the graph of y = 2|x − 3| + 5?",
     "options": [
      "(3, 5)",
      "(−3, 5)",
      "(3, −5)",
      "(5, 3)"
     ],
     "answer": "(3, 5)",
     "explanation": "Matching y = 2|x − 3| + 5 to y = a|x − h| + k gives h = 3 and k = 5, so the vertex is (3, 5).",
     "topic": "Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q16",
     "type": "mc",
     "prompt": "In y = a|x − h| + k, if a < 0, the graph:",
     "options": [
      "opens downward",
      "opens upward",
      "shifts left",
      "shifts right"
     ],
     "answer": "opens downward",
     "explanation": "A negative leading coefficient a flips the V-shape upside down, so the graph opens downward with a maximum at the vertex.",
     "topic": "Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q17",
     "type": "tf",
     "prompt": "True or False: The graph of y = |x − h| + k is symmetric about the vertical line x = h.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Each branch of the V mirrors the other across the vertical line through the vertex, x = h.",
     "topic": "Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q18",
     "type": "written",
     "prompt": "What is the vertex of the graph of y = |x + 6| − 2? Write your answer as an ordered pair.",
     "answer": "(-6, -2)",
     "accept": [
      "(-6,-2)",
      "-6,-2"
     ],
     "explanation": "Rewrite x + 6 as x − (−6), so h = −6 and k = −2, giving the vertex (−6, −2).",
     "topic": "Absolute Value Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q19",
     "type": "mc",
     "prompt": "A function is defined as f(x) = x + 2 for x < 0, and f(x) = x² for x ≥ 0. What is f(3)?",
     "options": [
      "9",
      "5",
      "3",
      "11"
     ],
     "answer": "9",
     "explanation": "Since 3 ≥ 0, use f(x) = x²: f(3) = 3² = 9.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q20",
     "type": "written",
     "prompt": "Using f(x) = x + 2 for x < 0, and f(x) = x² for x ≥ 0, find f(−2).",
     "answer": "0",
     "accept": [
      "0.0"
     ],
     "explanation": "Since −2 < 0, use f(x) = x + 2: f(−2) = −2 + 2 = 0.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q21",
     "type": "written",
     "prompt": "For the piecewise function f(x) = 2x when x ≤ 4, and f(x) = x + 10 when x > 4, find f(4).",
     "answer": "8",
     "accept": [
      "8.0"
     ],
     "explanation": "Since 4 ≤ 4, use f(x) = 2x: f(4) = 2(4) = 8.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q22",
     "type": "mc",
     "prompt": "The greatest integer function ⌊x⌋ gives:",
     "options": [
      "the greatest integer less than or equal to x",
      "the smallest integer greater than or equal to x",
      "x rounded to the nearest integer",
      "the value of x with its sign removed"
     ],
     "answer": "the greatest integer less than or equal to x",
     "explanation": "By definition, the greatest integer (floor) function rounds down to the nearest integer that does not exceed x.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q23",
     "type": "mc",
     "prompt": "What is ⌊4.7⌋?",
     "options": [
      "4",
      "5",
      "4.7",
      "0"
     ],
     "answer": "4",
     "explanation": "The greatest integer less than or equal to 4.7 is 4, since 5 is greater than 4.7.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q24",
     "type": "written",
     "prompt": "What is ⌊−2.3⌋?",
     "answer": "-3",
     "accept": [
      "−3"
     ],
     "explanation": "The greatest integer that is still less than or equal to −2.3 is −3, since −2 is greater than −2.3.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u13-q25",
     "type": "tf",
     "prompt": "True or False: A step function's graph looks like a series of flat, horizontal segments.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Step functions, like the greatest integer function, stay constant over intervals and jump to new constant values, forming a staircase of horizontal segments.",
     "topic": "Piecewise & Step Functions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q26",
     "type": "mc",
     "prompt": "A graph shows a parabola opening upward with vertex at (2, −3) that extends upward without bound. What is the range?",
     "options": [
      "y ≥ −3",
      "y ≤ −3",
      "x ≥ 2",
      "all real numbers"
     ],
     "answer": "y ≥ −3",
     "explanation": "Since the parabola opens upward from its lowest point at y = −3, every output value is −3 or greater, so the range is y ≥ −3.",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q27",
     "type": "tf",
     "prompt": "True or False: The domain of a function is the set of all possible output (y) values.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The domain is the set of possible input (x) values; the set of possible output values is the range.",
     "topic": "Domain and Range",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u13-q28",
     "type": "written",
     "prompt": "For the graph of y = |x − 1| − 4, what is the minimum y-value (the lower bound of the range)?",
     "answer": "-4",
     "accept": [
      "−4",
      "y=-4",
      "y = -4"
     ],
     "explanation": "The vertex of y = |x − 1| − 4 is (1, −4), and since a = 1 > 0 the graph opens upward, so −4 is the smallest y-value in the range.",
     "topic": "Domain and Range",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q29",
     "type": "mc",
     "prompt": "A table shows y-values of 3, 6, 12, 24, 48 for consecutive whole-number x-values. This pattern represents:",
     "options": [
      "an exponential function (constant ratio)",
      "a linear function (constant difference)",
      "a quadratic function",
      "a step function"
     ],
     "answer": "an exponential function (constant ratio)",
     "explanation": "Each output is double the one before it (6/3 = 2, 12/6 = 2, 24/12 = 2, 48/24 = 2), a constant ratio, which signals exponential growth.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q30",
     "type": "mc",
     "prompt": "A table shows y-values of 2, 5, 8, 11, 14 for x = 0, 1, 2, 3, 4. This pattern represents:",
     "options": [
      "a linear function (constant difference)",
      "an exponential function (constant ratio)",
      "a quadratic function",
      "a step function"
     ],
     "answer": "a linear function (constant difference)",
     "explanation": "Each output increases by the same amount, 3 (5−2=3, 8−5=3, 11−8=3, 14−11=3), a constant difference, which indicates a linear function.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q31",
     "type": "tf",
     "prompt": "True or False: A table in which outputs are multiplied by the same factor for each equal step in x represents a linear function.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A constant ratio between outputs signals an exponential function; a linear function instead has a constant difference between outputs.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q32",
     "type": "written",
     "prompt": "A population is recorded as 100, 150, 225, and 337.5 at years 0, 1, 2, and 3. Each year the population is multiplied by the same constant ratio. What is that ratio?",
     "answer": "1.5",
     "accept": [
      "3/2"
     ],
     "explanation": "Dividing consecutive terms gives 150/100 = 1.5 and 225/150 = 1.5, confirming a constant ratio of 1.5.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u13-q33",
     "type": "mc",
     "prompt": "For f(x) = x², what is the average rate of change from x = 1 to x = 4?",
     "options": [
      "5",
      "15",
      "3",
      "4"
     ],
     "answer": "5",
     "explanation": "Average rate of change = (f(4) − f(1))/(4 − 1) = (16 − 1)/3 = 15/3 = 5.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u13-q34",
     "type": "written",
     "prompt": "For f(x) = x² − 1, what is the average rate of change from x = 0 to x = 3?",
     "answer": "3",
     "accept": [
      "3.0"
     ],
     "explanation": "Average rate of change = (f(3) − f(0))/(3 − 0) = ((9−1) − (0−1))/3 = (8 − (−1))/3 = 9/3 = 3.",
     "topic": "Comparing Models & Rate of Change",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "alg1-u14",
   "unit": 14,
   "title": "Rational Expressions and Equations",
   "summary": "Learn to simplify, multiply, divide, add, and subtract rational expressions, and use these skills to solve rational equations and inverse variation problems. Practice finding excluded values, using the least common denominator, dividing polynomials by monomials, checking for extraneous solutions, and solving work-rate word problems.",
   "topics": [
    "Inverse Variation",
    "Excluded Values & Domain",
    "Simplifying Rational Expressions",
    "Multiplying & Dividing Rational Expressions",
    "Adding & Subtracting Rational Expressions",
    "Dividing Polynomials by Monomials",
    "Solving Rational Equations"
   ],
   "terms": [
    {
     "term": "Rational expression",
     "definition": "A fraction whose numerator and denominator are both polynomials.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Simplify",
     "definition": "To factor the numerator and denominator, then divide out any common factors.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Common factor",
     "definition": "A factor shared by both the numerator and denominator of a fraction.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Factoring",
     "definition": "Rewriting a polynomial as a product of two or more simpler polynomials.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Difference of squares",
     "definition": "The pattern a² − b² = (a + b)(a − b), used to factor certain binomials.",
     "topic": "Simplifying Rational Expressions"
    },
    {
     "term": "Inverse variation",
     "definition": "A relationship of the form y = k/x, where k is a nonzero constant.",
     "topic": "Inverse Variation"
    },
    {
     "term": "Constant of variation (k)",
     "definition": "The fixed value found by multiplying corresponding x- and y-values in y = k/x.",
     "topic": "Inverse Variation"
    },
    {
     "term": "Hyperbola",
     "definition": "The two-branch curve produced when graphing an inverse variation equation.",
     "topic": "Inverse Variation"
    },
    {
     "term": "Excluded value",
     "definition": "A value of the variable that makes a denominator equal to zero.",
     "topic": "Excluded Values & Domain"
    },
    {
     "term": "Undefined",
     "definition": "Having no numerical value, as happens when a fraction's denominator equals zero.",
     "topic": "Excluded Values & Domain"
    },
    {
     "term": "Domain",
     "definition": "The set of all input values for which an expression is defined.",
     "topic": "Excluded Values & Domain"
    },
    {
     "term": "Reciprocal",
     "definition": "The result of swapping a fraction's numerator and denominator.",
     "topic": "Multiplying & Dividing Rational Expressions"
    },
    {
     "term": "Dividing rational expressions",
     "definition": "Multiplying the first expression by the reciprocal of the second.",
     "topic": "Multiplying & Dividing Rational Expressions"
    },
    {
     "term": "Least common denominator (LCD)",
     "definition": "The smallest expression divisible by each denominator in a set of fractions.",
     "topic": "Adding & Subtracting Rational Expressions"
    },
    {
     "term": "Like denominators",
     "definition": "Denominators that are identical, so numerators can be combined directly.",
     "topic": "Adding & Subtracting Rational Expressions"
    },
    {
     "term": "Unlike denominators",
     "definition": "Denominators that differ, requiring a common denominator before combining fractions.",
     "topic": "Adding & Subtracting Rational Expressions"
    },
    {
     "term": "Monomial",
     "definition": "A polynomial made up of exactly one term.",
     "topic": "Dividing Polynomials by Monomials"
    },
    {
     "term": "Polynomial",
     "definition": "An expression made of terms with variables raised to whole-number exponents.",
     "topic": "Dividing Polynomials by Monomials"
    },
    {
     "term": "Term-by-term division",
     "definition": "Dividing each part of a polynomial separately by a monomial, then combining the results.",
     "topic": "Dividing Polynomials by Monomials"
    },
    {
     "term": "Rational equation",
     "definition": "An equation that contains one or more rational expressions with a variable in a denominator.",
     "topic": "Solving Rational Equations"
    },
    {
     "term": "Cross-multiplying",
     "definition": "Multiplying the numerator of each side by the other side's denominator when two fractions are set equal.",
     "topic": "Solving Rational Equations"
    },
    {
     "term": "Extraneous solution",
     "definition": "A value obtained while solving that does not satisfy the original equation, often because it creates a zero denominator.",
     "topic": "Solving Rational Equations"
    },
    {
     "term": "Work rate",
     "definition": "The portion of a task completed per unit of time, often written as 1/t.",
     "topic": "Solving Rational Equations"
    }
   ],
   "questions": [
    {
     "id": "alg1-u14-q1",
     "type": "mc",
     "prompt": "If y varies inversely with x, and y = 8 when x = 3, what is the constant of variation k?",
     "options": [
      "24",
      "11",
      "8/3",
      "3/8"
     ],
     "answer": "24",
     "explanation": "Since y = k/x, we get k = xy = 3 · 8 = 24.",
     "topic": "Inverse Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q2",
     "type": "mc",
     "prompt": "For an inverse variation with k = 20, what is y when x = 4?",
     "options": [
      "5",
      "80",
      "16",
      "0.2"
     ],
     "answer": "5",
     "explanation": "y = k/x = 20/4 = 5.",
     "topic": "Inverse Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q3",
     "type": "mc",
     "prompt": "Which equation represents inverse variation between x and y?",
     "options": [
      "y = k/x",
      "y = kx",
      "y = kx²",
      "y = x/k"
     ],
     "answer": "y = k/x",
     "explanation": "Inverse variation is defined by y = k/x for a nonzero constant k; direct variation instead uses y = kx.",
     "topic": "Inverse Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q4",
     "type": "tf",
     "prompt": "In an inverse variation y = k/x with k > 0, as x increases, y also increases.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Since y = k/x, increasing x makes y smaller, not larger — the values move in opposite directions.",
     "topic": "Inverse Variation",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q5",
     "type": "written",
     "prompt": "y varies inversely with x. If y = 12 when x = 2, find y when x = 8.",
     "answer": "3",
     "accept": [
      "y=3",
      "3.0"
     ],
     "explanation": "First find k = xy = 2 · 12 = 24. Then y = k/x = 24/8 = 3.",
     "topic": "Inverse Variation",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q6",
     "type": "mc",
     "prompt": "For the expression 5/(x − 3), which value of x must be excluded?",
     "options": [
      "x = 3",
      "x = −3",
      "x = 0",
      "x = 5"
     ],
     "answer": "x = 3",
     "explanation": "The denominator x − 3 equals 0 when x = 3, so x = 3 must be excluded from the domain.",
     "topic": "Excluded Values & Domain",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q7",
     "type": "mc",
     "prompt": "Which values must be excluded from (x + 2)/[(x − 1)(x + 4)]?",
     "options": [
      "x = 1 and x = −4",
      "x = −1 and x = 4",
      "x = 1 and x = 4",
      "x = −2 only"
     ],
     "answer": "x = 1 and x = −4",
     "explanation": "The denominator is 0 when x − 1 = 0 or x + 4 = 0, so x = 1 and x = −4 are excluded.",
     "topic": "Excluded Values & Domain",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q8",
     "type": "tf",
     "prompt": "The expression 7/(x + 4) is undefined when x = −4.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Substituting x = −4 makes the denominator x + 4 equal 0, so the expression is undefined there.",
     "topic": "Excluded Values & Domain",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q9",
     "type": "written",
     "prompt": "State the excluded value for the expression 2x/(x + 7).",
     "answer": "x=-7",
     "accept": [
      "-7",
      "x = -7",
      "x≠-7",
      "x ≠ -7",
      "x!=-7",
      "x != -7",
      "−7",
      "x = −7"
     ],
     "explanation": "The denominator x + 7 equals 0 when x = −7, so x = −7 must be excluded.",
     "topic": "Excluded Values & Domain",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q10",
     "type": "mc",
     "prompt": "Simplify 4x/(8x²), x ≠ 0.",
     "options": [
      "1/(2x)",
      "1/2",
      "2/x",
      "x/2"
     ],
     "answer": "1/(2x)",
     "explanation": "Write 4x/(8x²) = (4x · 1)/(4x · 2x), then divide out the common factor 4x to get 1/(2x).",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q11",
     "type": "mc",
     "prompt": "Simplify (x² − 4)/(x² + 5x + 6).",
     "options": [
      "(x − 2)/(x + 3)",
      "(x + 2)/(x + 3)",
      "(x − 2)/(x − 3)",
      "x − 2"
     ],
     "answer": "(x − 2)/(x + 3)",
     "explanation": "Factor to get (x−2)(x+2)/[(x+2)(x+3)]; canceling the common factor (x+2) leaves (x−2)/(x+3).",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u14-q12",
     "type": "tf",
     "prompt": "You can simplify a rational expression by canceling any matching terms in the numerator and denominator, even if they are not factors.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Only common factors (things being multiplied) can be canceled; canceling terms that are added or subtracted gives a wrong result.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q13",
     "type": "mc",
     "prompt": "Simplify 5x²/(15x), x ≠ 0.",
     "answer": "x/3",
     "accept": [
      "x/3"
     ],
     "explanation": "Write 5x²/(15x) = (5x · x)/(5x · 3), then divide out the common factor 5x to get x/3.",
     "topic": "Simplifying Rational Expressions",
     "difficulty": "medium",
     "options": [
      "x/3",
      "3/x",
      "x²/3",
      "1/(3x)"
     ]
    },
    {
     "id": "alg1-u14-q14",
     "type": "mc",
     "prompt": "Multiply: (2/x) · (x/5), x ≠ 0.",
     "options": [
      "2/5",
      "2/(5x)",
      "10/x",
      "x/10"
     ],
     "answer": "2/5",
     "explanation": "Multiply straight across to get 2x/(5x); the x's cancel, leaving 2/5.",
     "topic": "Multiplying & Dividing Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q15",
     "type": "mc",
     "prompt": "Divide: (3/x) ÷ (6/x²), x ≠ 0.",
     "options": [
      "x/2",
      "2/x",
      "x²/2",
      "18/x³"
     ],
     "answer": "x/2",
     "explanation": "Multiply by the reciprocal: (3/x) · (x²/6) = 3x²/6x, which simplifies to x/2.",
     "topic": "Multiplying & Dividing Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q16",
     "type": "mc",
     "prompt": "Multiply: (x + 1)/(x − 2) · (x − 2)/(x + 3), x ≠ 2, −3.",
     "options": [
      "(x + 1)/(x + 3)",
      "(x − 2)/(x + 3)",
      "(x + 1)/(x − 2)",
      "1/(x + 3)"
     ],
     "answer": "(x + 1)/(x + 3)",
     "explanation": "The (x − 2) factors cancel, leaving (x + 1)/(x + 3).",
     "topic": "Multiplying & Dividing Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q17",
     "type": "tf",
     "prompt": "To divide two rational expressions, you multiply the first expression by the reciprocal of the second.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Dividing by a fraction is the same as multiplying by its reciprocal, and the same rule applies to rational expressions.",
     "topic": "Multiplying & Dividing Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q18",
     "type": "mc",
     "prompt": "Add: 3/x + 5/x, x ≠ 0.",
     "options": [
      "8/x",
      "8/x²",
      "8/2x",
      "15/x²"
     ],
     "answer": "8/x",
     "explanation": "Since the denominators match, add the numerators: 3 + 5 = 8, giving 8/x.",
     "topic": "Adding & Subtracting Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q19",
     "type": "mc",
     "prompt": "What is the least common denominator (LCD) of 1/x and 1/(x + 2)?",
     "options": [
      "x(x + 2)",
      "x + 2",
      "x²",
      "2x + 2"
     ],
     "answer": "x(x + 2)",
     "explanation": "Since x and x + 2 share no common factor, the LCD is their product, x(x + 2).",
     "topic": "Adding & Subtracting Rational Expressions",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q20",
     "type": "mc",
     "prompt": "Subtract 2/x − 3/(x + 1) using the LCD x(x + 1). Which expression equals the result?",
     "options": [
      "(2 − x)/[x(x + 1)]",
      "(x − 2)/[x(x + 1)]",
      "(5x + 2)/[x(x + 1)]",
      "(2x − 1)/[x(x + 1)]"
     ],
     "answer": "(2 − x)/[x(x + 1)]",
     "explanation": "Rewrite each fraction: 2(x+1)/[x(x+1)] − 3x/[x(x+1)] = (2x + 2 − 3x)/[x(x+1)] = (2 − x)/[x(x+1)].",
     "topic": "Adding & Subtracting Rational Expressions",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u14-q21",
     "type": "tf",
     "prompt": "When adding rational expressions with unlike denominators, you must first rewrite them with a common denominator.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Just like with numeric fractions, the denominators must match before the numerators can be combined.",
     "topic": "Adding & Subtracting Rational Expressions",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q23",
     "type": "mc",
     "prompt": "Divide: (12x³ + 8x²)/(4x²), x ≠ 0.",
     "options": [
      "3x + 2",
      "3x² + 2x",
      "3x³ + 2x²",
      "2x + 3x²"
     ],
     "answer": "3x + 2",
     "explanation": "Divide each term by 4x²: 12x³/4x² = 3x and 8x²/4x² = 2, so the quotient is 3x + 2.",
     "topic": "Dividing Polynomials by Monomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q24",
     "type": "mc",
     "prompt": "Divide: (15x² − 10x)/(5x), x ≠ 0.",
     "options": [
      "3x − 2",
      "3x + 2",
      "3x² − 2",
      "15x − 2"
     ],
     "answer": "3x − 2",
     "explanation": "Divide each term by 5x: 15x²/5x = 3x and 10x/5x = 2, so the quotient is 3x − 2.",
     "topic": "Dividing Polynomials by Monomials",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q25",
     "type": "tf",
     "prompt": "Dividing a polynomial by a monomial means dividing every term of the polynomial by that monomial separately.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Each term in the numerator is divided by the single-term denominator one at a time, then the results are combined.",
     "topic": "Dividing Polynomials by Monomials",
     "difficulty": "easy"
    },
    {
     "id": "alg1-u14-q27",
     "type": "mc",
     "prompt": "When solving (x + 3)/(x − 2) = 5/(x − 2), a student gets x = 2. Why is x = 2 an extraneous solution?",
     "options": [
      "It makes the denominator x − 2 equal zero",
      "It makes the numerator x + 3 equal zero",
      "It makes the left side a negative number",
      "It makes the two numerators unequal"
     ],
     "answer": "It makes the denominator x − 2 equal zero",
     "explanation": "Multiplying both sides by x − 2 gives x + 3 = 5, so x = 2. But substituting x = 2 into the original equation makes the denominators 0, so the equation is undefined and x = 2 must be rejected.",
     "topic": "Solving Rational Equations",
     "difficulty": "hard"
    },
    {
     "id": "alg1-u14-q28",
     "type": "tf",
     "prompt": "When solving a rational equation, every value found algebraically is guaranteed to satisfy the original equation.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Multiplying by the LCD or cross-multiplying can introduce extraneous solutions that make a denominator zero, so each result must be checked.",
     "topic": "Solving Rational Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q29",
     "type": "written",
     "prompt": "Solve for x: 4/x = 8/6.",
     "answer": "x=3",
     "accept": [
      "3",
      "x = 3"
     ],
     "explanation": "Cross-multiply: 4 · 6 = 8 · x, so 24 = 8x and x = 3. Check: 4/3 and 8/6 both equal about 1.33.",
     "topic": "Solving Rational Equations",
     "difficulty": "medium"
    },
    {
     "id": "alg1-u14-q30",
     "type": "written",
     "prompt": "Pipe A can fill a pool in 6 hours, and Pipe B can fill the same pool in 3 hours. Working together, how many hours will it take to fill the pool?",
     "answer": "2",
     "accept": [
      "2 hours",
      "2 hrs",
      "2 hr",
      "2 h",
      "x=2",
      "t=2",
      "2.0"
     ],
     "explanation": "Add the rates: 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 pool per hour, so the time is 1 ÷ (1/2) = 2 hours. Check: in 2 hours A fills 2/6 and B fills 2/3 = 4/6, and 2/6 + 4/6 = 1 pool.",
     "topic": "Solving Rational Equations",
     "difficulty": "hard"
    }
   ]
  }
 ]
});
