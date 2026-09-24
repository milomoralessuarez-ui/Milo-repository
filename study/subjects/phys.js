/* Physics — StudyQuest subject file, generated from standard high school curriculum content.
   Every question was written, then fact-checked item by item by a separate reviewer.
   Checked by: node tools/verify-study.mjs */
(window.STUDY_SUBJECTS = window.STUDY_SUBJECTS || []).push({
 "id": "phys",
 "name": "Physics",
 "emoji": "🚀",
 "color": "#f59e0b",
 "blurb": "Motion, vectors and projectiles, Newton's laws, circular motion and gravity, energy, momentum, waves and sound, light and optics, and electricity and magnetism.",
 "sets": [
  {
   "id": "phys-u1",
   "unit": 1,
   "title": "Motion in One Dimension",
   "summary": "Learn to describe straight-line motion using position, distance, and displacement, and to calculate speed, velocity, and acceleration. Practice the kinematic equations, free-fall problems with g = 9.8 m/s², and reading position-time and velocity-time graphs.",
   "topics": [
    "Position & Displacement",
    "Speed & Velocity",
    "Acceleration",
    "Kinematic Equations",
    "Free Fall",
    "Position-Time Graphs",
    "Velocity-Time Graphs"
   ],
   "terms": [
    {
     "term": "Position",
     "definition": "An object's location relative to a chosen reference point, often given as a signed coordinate.",
     "topic": "Position & Displacement"
    },
    {
     "term": "Distance",
     "definition": "The total length of the path an object travels; a scalar that is never negative.",
     "topic": "Position & Displacement"
    },
    {
     "term": "Displacement",
     "definition": "The change in an object's location from a starting point to an ending point; a vector with magnitude and direction.",
     "topic": "Position & Displacement"
    },
    {
     "term": "Reference point (origin)",
     "definition": "The fixed location from which an object's location and motion are measured.",
     "topic": "Position & Displacement"
    },
    {
     "term": "Vector",
     "definition": "A quantity that has both magnitude and direction, such as displacement or velocity.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Scalar",
     "definition": "A quantity that has magnitude only, with no direction, such as distance or speed.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Speed",
     "definition": "The rate at which distance is covered, found by dividing distance by time; has no direction.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Velocity",
     "definition": "The rate of change of an object's location over time, including direction; a vector quantity.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Average velocity",
     "definition": "Total displacement divided by the total time interval over which it occurs.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Average speed",
     "definition": "Total distance traveled divided by the total time elapsed for a trip.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Instantaneous velocity",
     "definition": "How fast and in what direction an object is moving at one specific moment, rather than averaged over an interval.",
     "topic": "Speed & Velocity"
    },
    {
     "term": "Acceleration",
     "definition": "The rate at which an object's velocity changes over time; a vector, measured in meters per second squared.",
     "topic": "Acceleration"
    },
    {
     "term": "Uniform acceleration",
     "definition": "Motion in which the rate of change of velocity stays constant in both magnitude and direction.",
     "topic": "Acceleration"
    },
    {
     "term": "Deceleration",
     "definition": "Everyday word for slowing down: acceleration pointing opposite to the direction of motion.",
     "topic": "Acceleration"
    },
    {
     "term": "Initial velocity (v₀)",
     "definition": "How fast and in which direction an object moves at the start of the time interval studied.",
     "topic": "Kinematic Equations"
    },
    {
     "term": "Kinematic equations",
     "definition": "Formulas relating displacement, velocity, acceleration and time for motion with constant acceleration.",
     "topic": "Kinematic Equations"
    },
    {
     "term": "Free fall",
     "definition": "Motion of an object under gravity alone, assuming no air resistance acts on it.",
     "topic": "Free Fall"
    },
    {
     "term": "Acceleration due to gravity (g)",
     "definition": "The downward acceleration of freely falling objects near Earth's surface, about 9.8 m/s².",
     "topic": "Free Fall"
    },
    {
     "term": "Position-time graph",
     "definition": "A graph plotting an object's location on the vertical axis against time on the horizontal axis.",
     "topic": "Position-Time Graphs"
    },
    {
     "term": "Slope (of a graph)",
     "definition": "The steepness of a line on a graph, calculated as rise divided by run between two points.",
     "topic": "Position-Time Graphs"
    },
    {
     "term": "Slope formula",
     "definition": "m = (y₂ − y₁)/(x₂ − x₁), used to find the rate of change between two points on a line.",
     "topic": "Position-Time Graphs"
    },
    {
     "term": "Velocity-time graph",
     "definition": "A graph plotting an object's rate of motion on the vertical axis against time on the horizontal axis.",
     "topic": "Velocity-Time Graphs"
    },
    {
     "term": "Area under a velocity-time graph",
     "definition": "The region between the line and the time axis on a rate-of-motion plot; equals displacement.",
     "topic": "Velocity-Time Graphs"
    }
   ],
   "questions": [
    {
     "id": "phys-u1-q1",
     "type": "mc",
     "prompt": "A car drives 3 km east, then turns around and drives 3 km west back to its starting point. What is the magnitude of its total displacement?",
     "options": [
      "0 km",
      "3 km",
      "6 km",
      "9 km"
     ],
     "answer": "0 km",
     "explanation": "Displacement depends only on the start and end positions; since the car ends up back where it started, its displacement is 0 km, even though it traveled a total distance of 6 km.",
     "topic": "Position & Displacement",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q2",
     "type": "mc",
     "prompt": "Which statement correctly describes displacement?",
     "options": [
      "A vector equal to the straight-line change from initial to final position",
      "A scalar equal to the total path length traveled",
      "A vector that is always greater than the distance traveled",
      "A scalar measured only in the direction of motion"
     ],
     "answer": "A vector equal to the straight-line change from initial to final position",
     "explanation": "Displacement is a vector describing the straight-line change from an object's starting position to its ending position, unlike distance, which is a scalar measuring total path length.",
     "topic": "Position & Displacement",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q3",
     "type": "mc",
     "prompt": "A runner completes one full lap of a 400 m circular track in 50 s, ending at the same point where she started. What is the magnitude of her average velocity?",
     "options": [
      "0 m/s",
      "8 m/s",
      "50 m/s",
      "400 m/s"
     ],
     "answer": "0 m/s",
     "explanation": "Average velocity is displacement divided by time; since the runner returns to her starting point, her displacement is 0 m, so average velocity is 0 m/s (her average speed is 400 m / 50 s = 8 m/s, but speed and velocity are different).",
     "topic": "Speed & Velocity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q4",
     "type": "mc",
     "prompt": "Which pair correctly distinguishes speed from velocity?",
     "options": [
      "Speed is a scalar quantity; velocity is a vector quantity",
      "Speed is a vector quantity; velocity is a scalar quantity",
      "Speed and velocity always have the same numerical value",
      "Speed includes direction, but velocity does not"
     ],
     "answer": "Speed is a scalar quantity; velocity is a vector quantity",
     "explanation": "Speed has magnitude only, while velocity has both magnitude and direction, which is why velocity can be negative or point a certain way and speed cannot.",
     "topic": "Speed & Velocity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q5",
     "type": "mc",
     "prompt": "A cyclist travels 60 m north in 10 s, then continues 40 m north in the next 5 s. What is her average velocity for the entire 15 s trip? Round to the nearest hundredth.",
     "options": [
      "6.67 m/s north",
      "6 m/s north",
      "10 m/s north",
      "100 m/s north"
     ],
     "answer": "6.67 m/s north",
     "explanation": "Total displacement is 60 m + 40 m = 100 m north, and total time is 10 s + 5 s = 15 s, so average velocity = 100 m / 15 s ≈ 6.67 m/s north.",
     "topic": "Speed & Velocity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q6",
     "type": "mc",
     "prompt": "A car's velocity changes from 10 m/s to 30 m/s over 4 s. What is its acceleration?",
     "options": [
      "5 m/s²",
      "20 m/s²",
      "7.5 m/s²",
      "2.5 m/s²"
     ],
     "answer": "5 m/s²",
     "explanation": "Acceleration equals the change in velocity divided by time: (30 m/s − 10 m/s) / 4 s = 20 m/s / 4 s = 5 m/s².",
     "topic": "Acceleration",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q7",
     "type": "mc",
     "prompt": "A ball moving to the right is slowing down. Which statement about its acceleration is correct?",
     "options": [
      "Its acceleration points to the left, opposite its velocity",
      "Its acceleration points to the right, same as its velocity",
      "Its acceleration is zero because its speed is decreasing",
      "Its acceleration cannot be determined from this information"
     ],
     "answer": "Its acceleration points to the left, opposite its velocity",
     "explanation": "When an object slows down, its acceleration points opposite to its velocity; since the ball moves right and is slowing, its acceleration points left.",
     "topic": "Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q8",
     "type": "mc",
     "prompt": "A train slows from 40 m/s to a complete stop in 8 s. Taking the direction of motion as positive, what is its acceleration?",
     "options": [
      "-5 m/s²",
      "5 m/s²",
      "-8 m/s²",
      "-0.2 m/s²"
     ],
     "answer": "-5 m/s²",
     "explanation": "Acceleration = (final velocity − initial velocity) / time = (0 m/s − 40 m/s) / 8 s = −40 m/s / 8 s = −5 m/s², negative because the train is slowing while moving in the positive direction.",
     "topic": "Acceleration",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q9",
     "type": "mc",
     "prompt": "A car starts from rest and accelerates at 4 m/s² for 5 s. How far does it travel?",
     "options": [
      "50 m",
      "20 m",
      "100 m",
      "40 m"
     ],
     "answer": "50 m",
     "explanation": "Using Δx = v₀t + ½at², with v₀ = 0: Δx = 0 + ½(4 m/s²)(5 s)² = 0.5 × 4 × 25 = 50 m.",
     "topic": "Kinematic Equations",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q10",
     "type": "mc",
     "prompt": "A ball moving at 20 m/s decelerates at 2 m/s². Using v² = v₀² + 2aΔx, what is its velocity after it has traveled 75 m?",
     "options": [
      "10 m/s",
      "50 m/s",
      "100 m/s",
      "0 m/s"
     ],
     "answer": "10 m/s",
     "explanation": "v² = (20 m/s)² + 2(−2 m/s²)(75 m) = 400 − 300 = 100, so v = √100 = 10 m/s.",
     "topic": "Kinematic Equations",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q11",
     "type": "mc",
     "prompt": "An object has a known initial velocity and undergoes constant acceleration for a known time, but its final velocity is not given. Which kinematic equation directly gives its displacement?",
     "options": [
      "Δx = v₀t + ½at²",
      "v = v₀ + at",
      "v² = v₀² + 2aΔx",
      "Δx = ((v₀ + v)/2)t"
     ],
     "answer": "Δx = v₀t + ½at²",
     "explanation": "This equation uses only initial velocity, acceleration, and time to solve for displacement, without needing the final velocity that the other equations require.",
     "topic": "Kinematic Equations",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q12",
     "type": "mc",
     "prompt": "An object is dropped from rest and falls freely for 2 s, with air resistance ignored. Using g = 9.8 m/s², what is its velocity at that moment?",
     "options": [
      "19.6 m/s",
      "9.8 m/s",
      "4.9 m/s",
      "39.2 m/s"
     ],
     "answer": "19.6 m/s",
     "explanation": "Using v = v₀ + gt with v₀ = 0: v = 9.8 m/s² × 2 s = 19.6 m/s.",
     "topic": "Free Fall",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q13",
     "type": "mc",
     "prompt": "A rock is dropped from rest off a cliff and falls for 3 s before hitting the ground, with air resistance ignored. Using g = 9.8 m/s², how far did it fall?",
     "options": [
      "44.1 m",
      "29.4 m",
      "88.2 m",
      "9.8 m"
     ],
     "answer": "44.1 m",
     "explanation": "Using Δx = ½gt² with v₀ = 0: Δx = 0.5 × 9.8 m/s² × (3 s)² = 0.5 × 9.8 × 9 = 44.1 m.",
     "topic": "Free Fall",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q14",
     "type": "mc",
     "prompt": "Two balls of different mass are dropped from the same height at the same time, with air resistance ignored. Which statement is correct?",
     "options": [
      "They land at the same time because free-fall acceleration doesn't depend on mass",
      "The heavier ball lands first because it experiences greater gravitational force",
      "The lighter ball lands first because it has less inertia to overcome",
      "They land at different times, but only because of Earth's rotation"
     ],
     "answer": "They land at the same time because free-fall acceleration doesn't depend on mass",
     "explanation": "In free fall without air resistance, all objects accelerate downward at the same rate, g = 9.8 m/s², regardless of their mass, so they land at the same time.",
     "topic": "Free Fall",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q15",
     "type": "mc",
     "prompt": "On a position-time graph, what physical quantity does the slope of the line represent?",
     "options": [
      "Velocity",
      "Acceleration",
      "Displacement",
      "Distance"
     ],
     "answer": "Velocity",
     "explanation": "Slope is rise over run, which on a position-time graph is change in position divided by change in time, the definition of velocity.",
     "topic": "Position-Time Graphs",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q16",
     "type": "mc",
     "prompt": "A position-time graph shows a horizontal straight line for an object over a 5 s interval. What does this indicate?",
     "options": [
      "The object is at rest for that interval",
      "The object is moving at a constant nonzero velocity",
      "The object is accelerating at a constant rate",
      "The object is moving backward at constant speed"
     ],
     "answer": "The object is at rest for that interval",
     "explanation": "A horizontal line has a slope of zero, and since slope equals velocity on a position-time graph, zero slope means the object's position is not changing — it is at rest.",
     "topic": "Position-Time Graphs",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q17",
     "type": "mc",
     "prompt": "A position-time graph is a straight line passing through the points (0 s, 2 m) and (4 s, 18 m). What is the object's velocity?",
     "options": [
      "4 m/s",
      "16 m/s",
      "8 m/s",
      "2 m/s"
     ],
     "answer": "4 m/s",
     "explanation": "Slope = (18 m − 2 m) / (4 s − 0 s) = 16 m / 4 s = 4 m/s.",
     "topic": "Position-Time Graphs",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q18",
     "type": "mc",
     "prompt": "On a velocity-time graph, what physical quantity does the area between the line and the time axis represent?",
     "options": [
      "Displacement",
      "Velocity",
      "Acceleration",
      "Average speed"
     ],
     "answer": "Displacement",
     "explanation": "The area under a velocity-time graph equals velocity multiplied by time, which is displacement.",
     "topic": "Velocity-Time Graphs",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q19",
     "type": "mc",
     "prompt": "A velocity-time graph shows an object moving at a constant 10 m/s for 6 s. What is its displacement during this time?",
     "options": [
      "60 m",
      "16 m",
      "1.7 m",
      "600 m"
     ],
     "answer": "60 m",
     "explanation": "The area under the graph is a rectangle: displacement = velocity × time = 10 m/s × 6 s = 60 m.",
     "topic": "Velocity-Time Graphs",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q20",
     "type": "mc",
     "prompt": "A velocity-time graph is a straight line rising from 0 m/s to 20 m/s over 5 s. What is the object's acceleration?",
     "options": [
      "4 m/s²",
      "20 m/s²",
      "5 m/s²",
      "100 m/s²"
     ],
     "answer": "4 m/s²",
     "explanation": "Acceleration equals the slope of a velocity-time graph: (20 m/s − 0 m/s) / 5 s = 4 m/s².",
     "topic": "Velocity-Time Graphs",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q21",
     "type": "tf",
     "prompt": "Distance is a scalar quantity, while displacement is a vector quantity.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Distance only has a size (magnitude), while displacement has both a size and a direction, making distance a scalar and displacement a vector.",
     "topic": "Position & Displacement",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q22",
     "type": "tf",
     "prompt": "Displacement is always greater than or equal to the distance traveled for the same trip.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is backwards: distance traveled is always greater than or equal to the magnitude of displacement, since displacement is the shortest straight-line change in position.",
     "topic": "Position & Displacement",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q23",
     "type": "tf",
     "prompt": "For any trip, average speed is always greater than or equal to the magnitude of average velocity for that same trip.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since total distance traveled is always greater than or equal to the magnitude of displacement, dividing both by the same time interval shows average speed is always greater than or equal to average velocity's magnitude.",
     "topic": "Speed & Velocity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q24",
     "type": "tf",
     "prompt": "Velocity describes only how fast an object is moving, not the direction it moves in.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This describes speed, not velocity; velocity is a vector that includes both how fast an object moves and the direction it moves in.",
     "topic": "Speed & Velocity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q25",
     "type": "tf",
     "prompt": "An object can have zero instantaneous velocity at a moment when its acceleration is nonzero, such as a ball at the very top of its vertical toss.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "At the top of its path, a tossed ball's velocity is momentarily zero, but gravity is still acting on it, so its acceleration remains 9.8 m/s² downward the whole time.",
     "topic": "Acceleration",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q26",
     "type": "tf",
     "prompt": "An object thrown straight upward has zero acceleration at the highest point of its path.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Acceleration due to gravity acts on the object throughout its entire flight, including at the top; only its velocity is momentarily zero there, not its acceleration.",
     "topic": "Free Fall",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q27",
     "type": "tf",
     "prompt": "Near Earth's surface, all objects in free fall (ignoring air resistance) accelerate downward at about 9.8 m/s², regardless of their mass.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Free-fall acceleration near Earth's surface is approximately 9.8 m/s² for every object, since it does not depend on the object's mass.",
     "topic": "Free Fall",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q28",
     "type": "tf",
     "prompt": "On a velocity-time graph, the slope of the line represents the object's displacement.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "On a velocity-time graph, the slope represents acceleration; it is the area between the line and the time axis that represents displacement.",
     "topic": "Velocity-Time Graphs",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q29",
     "type": "written",
     "prompt": "What is the term for the total length of the path an object travels, regardless of direction?",
     "answer": "distance",
     "accept": [],
     "explanation": "Distance measures the total path length covered and is a scalar that is never negative, unlike displacement, which depends on direction.",
     "topic": "Position & Displacement",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q30",
     "type": "written",
     "prompt": "A hiker walks 8 km east, then turns around and walks 3 km west. What is the magnitude of her total displacement?",
     "answer": "5 km",
     "accept": [
      "5",
      "5 kilometers",
      "5km",
      "5 km east",
      "5 kilometers east"
     ],
     "explanation": "Taking east as positive, displacement = 8 km − 3 km = 5 km east, so its magnitude is 5 km.",
     "topic": "Position & Displacement",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q31",
     "type": "written",
     "prompt": "A car travels 150 m in 6 s at constant speed. What is its speed?",
     "answer": "25 m/s",
     "accept": [
      "25",
      "25 meters per second",
      "25m/s"
     ],
     "explanation": "Speed = distance / time = 150 m / 6 s = 25 m/s.",
     "topic": "Speed & Velocity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q32",
     "type": "written",
     "prompt": "What term describes an object's velocity at one specific instant in time, rather than averaged over an interval?",
     "answer": "instantaneous velocity",
     "accept": [
      "instant velocity",
      "velocity at an instant"
     ],
     "explanation": "Instantaneous velocity is the velocity an object has at a single moment, as opposed to average velocity, which is found over a time interval.",
     "topic": "Speed & Velocity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u1-q33",
     "type": "written",
     "prompt": "A skateboarder speeds up from 2 m/s to 14 m/s in 4 s. What is her acceleration?",
     "answer": "3 m/s²",
     "accept": [
      "3",
      "3 m/s^2",
      "3 m/s2",
      "3 meters per second squared",
      "3 m/s/s",
      "3 meters per second per second"
     ],
     "explanation": "Acceleration = (final velocity − initial velocity) / time = (14 m/s − 2 m/s) / 4 s = 12 m/s / 4 s = 3 m/s².",
     "topic": "Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q34",
     "type": "written",
     "prompt": "A car accelerates from rest at 2 m/s² for 6 s. Using v = v₀ + at, what is its final velocity?",
     "answer": "12 m/s",
     "accept": [
      "12",
      "12 meters per second",
      "12m/s"
     ],
     "explanation": "v = v₀ + at = 0 + (2 m/s² × 6 s) = 12 m/s.",
     "topic": "Kinematic Equations",
     "difficulty": "medium"
    },
    {
     "id": "phys-u1-q35",
     "type": "written",
     "prompt": "A ball is dropped from rest and falls for 1.5 s before landing, with air resistance ignored. Using g = 9.8 m/s², what is its velocity just before landing? Round to the nearest tenth.",
     "answer": "14.7 m/s",
     "accept": [
      "14.7",
      "14.7 meters per second",
      "14.7m/s"
     ],
     "explanation": "v = v₀ + gt = 0 + (9.8 m/s² × 1.5 s) = 14.7 m/s.",
     "topic": "Free Fall",
     "difficulty": "hard"
    },
    {
     "id": "phys-u1-q36",
     "type": "written",
     "prompt": "On a position-time graph, an object's position changes from 4 m at t = 0 s to 24 m at t = 5 s along a straight line. What is its velocity?",
     "answer": "4 m/s",
     "accept": [
      "4",
      "4 meters per second",
      "4m/s"
     ],
     "explanation": "Velocity equals the slope of the line: (24 m − 4 m) / (5 s − 0 s) = 20 m / 5 s = 4 m/s.",
     "topic": "Position-Time Graphs",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "phys-u2",
   "unit": 2,
   "title": "Vectors and Projectile Motion",
   "summary": "This unit covers the difference between scalar and vector quantities, how to add vectors graphically (tip-to-tail) and by breaking them into horizontal and vertical components using sine and cosine, and how projectiles move under gravity. Students practice finding resultants and their directions, calculating time of flight and range for horizontal launches, and combining velocities between different reference frames.",
   "topics": [
    "Scalars & Vectors",
    "Adding Vectors",
    "Vector Components",
    "Projectile Motion",
    "Time of Flight",
    "Relative Velocity"
   ],
   "terms": [
    {
     "term": "Scalar",
     "definition": "A quantity described by magnitude alone, with no direction, such as mass or time.",
     "topic": "Scalars & Vectors"
    },
    {
     "term": "Vector",
     "definition": "A quantity that has both magnitude and direction, such as displacement or force.",
     "topic": "Scalars & Vectors"
    },
    {
     "term": "Magnitude",
     "definition": "The size of a vector without regard to its direction; it is never negative.",
     "topic": "Scalars & Vectors"
    },
    {
     "term": "Displacement",
     "definition": "The straight-line distance and direction from a starting point to an ending point.",
     "topic": "Scalars & Vectors"
    },
    {
     "term": "Resultant",
     "definition": "The single vector that represents the combined effect of two or more added vectors.",
     "topic": "Adding Vectors"
    },
    {
     "term": "Tip-to-tail method",
     "definition": "Graphical addition: start each vector where the previous one ends; the sum runs from the first start to the last end.",
     "topic": "Adding Vectors"
    },
    {
     "term": "Equilibrant",
     "definition": "A vector equal in magnitude but opposite in direction to the resultant, bringing a system into balance.",
     "topic": "Adding Vectors"
    },
    {
     "term": "Component",
     "definition": "The part of a vector that lies along one coordinate axis, such as the x- or y-direction.",
     "topic": "Vector Components"
    },
    {
     "term": "Horizontal component formula",
     "definition": "Vₓ = V cos θ, where θ is the angle measured from the horizontal axis.",
     "topic": "Vector Components"
    },
    {
     "term": "Vertical component formula",
     "definition": "V_y = V sin θ, where θ is the angle measured from the horizontal axis.",
     "topic": "Vector Components"
    },
    {
     "term": "Resultant magnitude formula",
     "definition": "R = √(Rₓ² + R_y²), used to find a vector's size from its two perpendicular components.",
     "topic": "Vector Components"
    },
    {
     "term": "Direction of resultant formula",
     "definition": "θ = tan⁻¹(R_y/Rₓ), giving the angle a vector makes with the x-axis.",
     "topic": "Vector Components"
    },
    {
     "term": "Projectile",
     "definition": "An object that is launched into the air and then moves under the influence of gravity alone.",
     "topic": "Projectile Motion"
    },
    {
     "term": "Trajectory",
     "definition": "The curved, parabolic path followed by a projectile during its flight.",
     "topic": "Projectile Motion"
    },
    {
     "term": "Free fall",
     "definition": "Motion in which gravity is the only force acting on an object, producing constant downward acceleration.",
     "topic": "Projectile Motion"
    },
    {
     "term": "Independence of motion",
     "definition": "The principle that a projectile's horizontal and vertical motions occur separately and do not influence each other.",
     "topic": "Projectile Motion"
    },
    {
     "term": "Range (projectile)",
     "definition": "The total horizontal distance a projectile covers before landing.",
     "topic": "Projectile Motion"
    },
    {
     "term": "Time of flight",
     "definition": "The total time an object spends in the air during projectile motion.",
     "topic": "Time of Flight"
    },
    {
     "term": "Acceleration due to gravity",
     "definition": "The constant downward acceleration of a falling object near Earth's surface, about 9.8 m/s².",
     "topic": "Time of Flight"
    },
    {
     "term": "Time of flight (horizontal launch) formula",
     "definition": "t = √(2h/g), the time for an object launched horizontally to fall a height h.",
     "topic": "Time of Flight"
    },
    {
     "term": "Relative velocity",
     "definition": "The velocity of an object as measured from a specific moving or stationary reference frame.",
     "topic": "Relative Velocity"
    },
    {
     "term": "Reference frame",
     "definition": "A viewpoint or coordinate system, such as the ground or moving water, from which motion is measured.",
     "topic": "Relative Velocity"
    }
   ],
   "questions": [
    {
     "id": "phys-u2-q1",
     "type": "mc",
     "prompt": "Which of the following is a vector quantity?",
     "options": [
      "Mass",
      "Speed",
      "Displacement",
      "Temperature"
     ],
     "answer": "Displacement",
     "explanation": "Displacement has both a magnitude and a direction (e.g., 5 m north), while mass, speed, and temperature are described by magnitude alone.",
     "topic": "Scalars & Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q2",
     "type": "mc",
     "prompt": "Which of the following is a scalar quantity?",
     "options": [
      "Velocity",
      "Distance",
      "Force",
      "Acceleration"
     ],
     "answer": "Distance",
     "explanation": "Distance is just a magnitude (how far something traveled) with no direction attached, unlike velocity, force, and acceleration.",
     "topic": "Scalars & Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q3",
     "type": "mc",
     "prompt": "When adding vectors using the tip-to-tail method, where does the resultant vector point?",
     "options": [
      "From the tip of the first vector to the tail of the last vector",
      "From the tail of the first vector to the tip of the last vector",
      "From the tail of the first vector back to its own tip",
      "In the same direction as the shorter vector"
     ],
     "answer": "From the tail of the first vector to the tip of the last vector",
     "explanation": "After drawing each vector starting at the tip of the previous one, the resultant is the single vector connecting the very first tail to the very last tip.",
     "topic": "Adding Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q4",
     "type": "mc",
     "prompt": "A hiker walks 30 m east, then 40 m north. What is the magnitude of the resultant displacement?",
     "options": [
      "70 m",
      "50 m",
      "35 m",
      "10 m"
     ],
     "answer": "50 m",
     "explanation": "Since the legs are perpendicular, use the Pythagorean theorem: R = √(30² + 40²) = √(900 + 1600) = √2500 = 50 m. 70 m is the simple sum and 10 m is the difference, neither of which applies to perpendicular vectors.",
     "topic": "Adding Vectors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q5",
     "type": "mc",
     "prompt": "For the hiker who walks 30 m east then 40 m north, what is the direction of the resultant, measured as an angle north of east? Round to the nearest degree.",
     "options": [
      "37° north of east",
      "53° north of east",
      "45° north of east",
      "60° north of east"
     ],
     "answer": "53° north of east",
     "explanation": "θ = tan⁻¹(opposite/adjacent) = tan⁻¹(40/30) = tan⁻¹(1.333) ≈ 53.1°, which rounds to 53°.",
     "topic": "Adding Vectors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q6",
     "type": "mc",
     "prompt": "A force of 100 N is applied at 37° above the horizontal (use cos 37° ≈ 0.8, sin 37° ≈ 0.6). What is the horizontal component of this force?",
     "options": [
      "37 N",
      "60 N",
      "80 N",
      "100 N"
     ],
     "answer": "80 N",
     "explanation": "The horizontal component is Fx = F cos θ = 100 N × 0.8 = 80 N.",
     "topic": "Vector Components",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q7",
     "type": "mc",
     "prompt": "For the same 100 N force applied at 37° above the horizontal (cos 37° ≈ 0.8, sin 37° ≈ 0.6), what is the vertical component?",
     "options": [
      "100 N",
      "40 N",
      "60 N",
      "80 N"
     ],
     "answer": "60 N",
     "explanation": "The vertical component is Fy = F sin θ = 100 N × 0.6 = 60 N.",
     "topic": "Vector Components",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q8",
     "type": "mc",
     "prompt": "A ball is launched horizontally off a cliff. Ignoring air resistance, what happens to its horizontal velocity during the flight?",
     "options": [
      "It increases at 9.8 m/s²",
      "It remains constant",
      "It decreases at 9.8 m/s²",
      "It becomes zero at the peak"
     ],
     "answer": "It remains constant",
     "explanation": "With no air resistance, gravity only acts vertically, so there is no horizontal force and the horizontal velocity stays the same for the whole flight.",
     "topic": "Projectile Motion",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q9",
     "type": "mc",
     "prompt": "A ball is launched horizontally off a cliff. Ignoring air resistance, what happens to its vertical velocity during the flight?",
     "options": [
      "It stays constant",
      "It changes at a constant rate due to gravity",
      "It is always zero",
      "It equals the horizontal velocity"
     ],
     "answer": "It changes at a constant rate due to gravity",
     "explanation": "Gravity provides a constant downward acceleration of about 9.8 m/s², so the vertical velocity increases downward at a steady rate throughout the flight.",
     "topic": "Projectile Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q10",
     "type": "mc",
     "prompt": "A stone is thrown horizontally from the top of a 20 m tall cliff. Using g = 9.8 m/s², about how long does it take to hit the ground?",
     "options": [
      "4.0 s",
      "2.0 s",
      "1.0 s",
      "6.3 s"
     ],
     "answer": "2.0 s",
     "explanation": "For a horizontal launch, t = √(2h/g) = √(2×20/9.8) = √(40/9.8) = √4.08 ≈ 2.02 s, which rounds to 2.0 s.",
     "topic": "Time of Flight",
     "difficulty": "hard"
    },
    {
     "id": "phys-u2-q11",
     "type": "mc",
     "prompt": "A ball launched horizontally at 12 m/s takes 3 s to hit the ground. How far does it travel horizontally before landing?",
     "options": [
      "24 m",
      "36 m",
      "4 m",
      "3 m"
     ],
     "answer": "36 m",
     "explanation": "Horizontal distance (range) = horizontal speed × time = 12 m/s × 3 s = 36 m, since horizontal speed stays constant.",
     "topic": "Time of Flight",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q12",
     "type": "mc",
     "prompt": "Which statement best describes the 'independence of motion' in projectile motion?",
     "options": [
      "Time of flight depends on horizontal velocity",
      "Horizontal and vertical motions occur independently and do not affect each other",
      "Horizontal motion determines vertical acceleration",
      "The projectile's speed is independent of gravity"
     ],
     "answer": "Horizontal and vertical motions occur independently and do not affect each other",
     "explanation": "The horizontal motion (constant velocity) and vertical motion (constant acceleration due to gravity) happen at the same time but do not influence one another.",
     "topic": "Projectile Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q13",
     "type": "mc",
     "prompt": "A swimmer swims directly across a river at 2 m/s relative to the water, while the current flows at 1.5 m/s perpendicular to the swimmer's heading. What is the swimmer's resultant speed relative to the shore?",
     "options": [
      "3.5 m/s",
      "2.5 m/s",
      "0.5 m/s",
      "2.0 m/s"
     ],
     "answer": "2.5 m/s",
     "explanation": "Since the swimmer's velocity and the current are perpendicular, R = √(2² + 1.5²) = √(4 + 2.25) = √6.25 = 2.5 m/s.",
     "topic": "Relative Velocity",
     "difficulty": "hard"
    },
    {
     "id": "phys-u2-q14",
     "type": "mc",
     "prompt": "A plane flies with an airspeed of 200 km/h due north while a crosswind blows at 50 km/h due east. What is the plane's resultant ground speed, to the nearest km/h?",
     "options": [
      "250 km/h",
      "206 km/h",
      "200 km/h",
      "150 km/h"
     ],
     "answer": "206 km/h",
     "explanation": "The velocities are perpendicular, so R = √(200² + 50²) = √(40000 + 2500) = √42500 ≈ 206.2 km/h, which rounds to 206 km/h.",
     "topic": "Relative Velocity",
     "difficulty": "hard"
    },
    {
     "id": "phys-u2-q15",
     "type": "mc",
     "prompt": "For a projectile launched horizontally off a cliff, which quantities determine its time of flight?",
     "options": [
      "Initial horizontal speed and launch angle",
      "Mass of the projectile",
      "Launch height and gravitational acceleration",
      "Horizontal speed alone"
     ],
     "answer": "Launch height and gravitational acceleration",
     "explanation": "Time of flight for a horizontal launch is t = √(2h/g), which depends only on the height h and gravity g, not on the horizontal speed or mass.",
     "topic": "Time of Flight",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q16",
     "type": "mc",
     "prompt": "Which pair of vectors, when added together, produces a resultant with zero magnitude?",
     "options": [
      "5 N east and 5 N north",
      "5 N east and 3 N east",
      "5 N east and 5 N east",
      "5 N east and 5 N west"
     ],
     "answer": "5 N east and 5 N west",
     "explanation": "Vectors of equal magnitude pointing in exactly opposite directions cancel out completely, giving a resultant of 0 N.",
     "topic": "Adding Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q17",
     "type": "tf",
     "prompt": "A scalar quantity has both magnitude and direction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "A scalar has magnitude only; it is a vector that has both magnitude and direction.",
     "topic": "Scalars & Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q18",
     "type": "tf",
     "prompt": "In the tip-to-tail method, the resultant vector is drawn from the tail of the first vector to the tip of the last vector.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is exactly how the tip-to-tail (head-to-tail) method defines the resultant of a set of added vectors.",
     "topic": "Adding Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q19",
     "type": "tf",
     "prompt": "The horizontal component of a vector is found using the formula Vx = V sin θ, where θ is measured from the horizontal axis.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "When θ is measured from the horizontal, the horizontal component uses cosine (Vx = V cos θ); sine gives the vertical component.",
     "topic": "Vector Components",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q20",
     "type": "tf",
     "prompt": "In projectile motion with no air resistance, the horizontal velocity of the projectile stays the same throughout the flight.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "With gravity acting only vertically, there is no horizontal force, so horizontal velocity remains constant the whole time.",
     "topic": "Projectile Motion",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q21",
     "type": "tf",
     "prompt": "In projectile motion, the vertical acceleration of the projectile is zero throughout its flight.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The vertical acceleration is constant but not zero; it equals g (about 9.8 m/s²) directed downward the entire flight.",
     "topic": "Projectile Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q22",
     "type": "tf",
     "prompt": "For a projectile launched horizontally off a cliff, the time of flight depends only on the launch height and gravity, not on the initial horizontal speed.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since t = √(2h/g), the time to fall depends only on height h and gravity g; a faster horizontal launch only changes how far it travels, not how long it falls.",
     "topic": "Time of Flight",
     "difficulty": "hard"
    },
    {
     "id": "phys-u2-q23",
     "type": "tf",
     "prompt": "Relative velocity depends on the reference frame from which the motion is being observed.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "The same motion can look different depending on the observer's frame, such as a boat's velocity relative to the water versus relative to the shore.",
     "topic": "Relative Velocity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q24",
     "type": "tf",
     "prompt": "Two vectors of equal magnitude pointing in exactly opposite directions add up to a resultant with double the magnitude of either vector.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Opposite vectors of equal magnitude cancel each other out, giving a resultant of zero, not double the magnitude.",
     "topic": "Adding Vectors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q25",
     "type": "written",
     "prompt": "Two perpendicular displacement vectors, 6 m east and 8 m north, are added together. What is the magnitude of the resultant, in meters?",
     "answer": "10 m",
     "accept": [
      "10",
      "10 meters",
      "10m"
     ],
     "explanation": "Using the Pythagorean theorem: R = √(6² + 8²) = √(36 + 64) = √100 = 10 m.",
     "topic": "Adding Vectors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q26",
     "type": "written",
     "prompt": "A vector has a magnitude of 20 N at 60° above the horizontal. What is its horizontal component? (cos 60° = 0.5)",
     "answer": "10 N",
     "accept": [
      "10",
      "10 newtons",
      "10n"
     ],
     "explanation": "Horizontal component = V cos θ = 20 N × 0.5 = 10 N.",
     "topic": "Vector Components",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q27",
     "type": "written",
     "prompt": "A vector has a magnitude of 20 N at 60° above the horizontal. What is its vertical component? Round to one decimal place.",
     "answer": "17.3 N",
     "accept": [
      "17.3",
      "17.3 newtons",
      "17.32",
      "17.32 N"
     ],
     "explanation": "Vertical component = V sin θ = 20 N × sin 60° = 20 × 0.866 = 17.32 N, which rounds to 17.3 N.",
     "topic": "Vector Components",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q28",
     "type": "written",
     "prompt": "A ball is thrown horizontally at 15 m/s from a height of 19.6 m. Using g = 9.8 m/s², how long does it take to hit the ground?",
     "answer": "2 s",
     "accept": [
      "2",
      "2 seconds",
      "2s"
     ],
     "explanation": "t = √(2h/g) = √(2×19.6/9.8) = √(39.2/9.8) = √4 = 2 s.",
     "topic": "Time of Flight",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q29",
     "type": "written",
     "prompt": "Using the ball from the previous problem (launched horizontally at 15 m/s, taking 2 s to fall), what horizontal distance does it travel before landing?",
     "answer": "30 m",
     "accept": [
      "30",
      "30 meters",
      "30m"
     ],
     "explanation": "Horizontal distance = horizontal speed × time = 15 m/s × 2 s = 30 m.",
     "topic": "Time of Flight",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q30",
     "type": "written",
     "prompt": "A boat heads directly across a river at 4 m/s relative to the water, while the current flows at 3 m/s perpendicular to the boat's heading. What is the boat's resultant speed relative to the shore?",
     "answer": "5 m/s",
     "accept": [
      "5",
      "5 meters per second",
      "5m/s"
     ],
     "explanation": "Since the boat's velocity and the current are perpendicular, R = √(4² + 3²) = √(16 + 9) = √25 = 5 m/s.",
     "topic": "Relative Velocity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u2-q31",
     "type": "written",
     "prompt": "What is the name of the single vector that represents the combined effect of two or more vectors added together?",
     "answer": "Resultant",
     "accept": [
      "resultant vector",
      "the resultant"
     ],
     "explanation": "The resultant is the one vector equivalent to the sum of all the individual vectors being combined.",
     "topic": "Adding Vectors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u2-q32",
     "type": "written",
     "prompt": "For a projectile in flight with no air resistance, what is its horizontal acceleration?",
     "answer": "0 m/s^2",
     "accept": [
      "0",
      "0 m/s²",
      "0 m/s2",
      "zero",
      "zero m/s^2",
      "0 meters per second squared",
      "zero meters per second squared",
      "no acceleration",
      "none"
     ],
     "explanation": "Gravity acts only vertically, so there is no horizontal force on the projectile and therefore no horizontal acceleration.",
     "topic": "Projectile Motion",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "phys-u3",
   "unit": 3,
   "title": "Forces and Newton's Laws",
   "summary": "Explore how forces cause and change motion through Newton's three laws, the difference between mass and weight, and everyday forces like normal force, tension, and friction. You'll practice drawing free-body diagrams and solving problems using F = ma, W = mg, and F_f = μF_N.",
   "topics": [
    "Force and Inertia",
    "Newton's Second Law",
    "Newton's Third Law",
    "Mass and Weight",
    "Free-Body Diagrams and Equilibrium",
    "Normal Force and Tension",
    "Friction"
   ],
   "terms": [
    {
     "term": "Force",
     "definition": "A push or pull on an object, measured in newtons, that can change an object's motion",
     "topic": "Force and Inertia"
    },
    {
     "term": "Newton (N)",
     "definition": "The SI unit of force, equal to the force that accelerates a 1 kg mass at 1 m/s²",
     "topic": "Force and Inertia"
    },
    {
     "term": "Net force",
     "definition": "The overall force on an object found by adding all individual forces as vectors",
     "topic": "Force and Inertia"
    },
    {
     "term": "Inertia",
     "definition": "An object's tendency to resist changes in its state of motion",
     "topic": "Force and Inertia"
    },
    {
     "term": "Newton's First Law",
     "definition": "An object stays at rest or moves at constant velocity unless acted on by a net force",
     "topic": "Force and Inertia"
    },
    {
     "term": "Applied force",
     "definition": "A force exerted on an object directly by a person or another object",
     "topic": "Force and Inertia"
    },
    {
     "term": "Vector",
     "definition": "A quantity, such as force, that has both magnitude and direction",
     "topic": "Force and Inertia"
    },
    {
     "term": "Newton's Second Law",
     "definition": "The net force on an object equals its mass times its acceleration, written F_net = ma",
     "topic": "Newton's Second Law"
    },
    {
     "term": "Acceleration",
     "definition": "The rate at which an object's velocity changes, measured in m/s²",
     "topic": "Newton's Second Law"
    },
    {
     "term": "Mass",
     "definition": "The amount of matter in an object, measured in kilograms; stays the same regardless of location",
     "topic": "Mass and Weight"
    },
    {
     "term": "Weight",
     "definition": "The gravitational force pulling an object toward Earth (or another body), measured in newtons",
     "topic": "Mass and Weight"
    },
    {
     "term": "Weight formula",
     "definition": "W = mg, where W is weight in newtons, m is mass in kilograms, and g is gravitational acceleration",
     "topic": "Mass and Weight"
    },
    {
     "term": "Gravitational acceleration (g)",
     "definition": "The acceleration due to gravity near Earth's surface, about 9.8 m/s²",
     "topic": "Mass and Weight"
    },
    {
     "term": "Spring scale",
     "definition": "A device that measures the force of weight using the stretch of a spring",
     "topic": "Mass and Weight"
    },
    {
     "term": "Apparent weight",
     "definition": "The support force felt by an object, which can differ from its true weight when accelerating",
     "topic": "Mass and Weight"
    },
    {
     "term": "Newton's Third Law",
     "definition": "For every action force one object exerts, a second object exerts an equal and opposite reaction force back",
     "topic": "Newton's Third Law"
    },
    {
     "term": "Action-reaction pair",
     "definition": "Two forces equal in size and opposite in direction that act on two different objects",
     "topic": "Newton's Third Law"
    },
    {
     "term": "Free-body diagram",
     "definition": "A sketch showing every external force on a single object as a labeled arrow",
     "topic": "Free-Body Diagrams and Equilibrium"
    },
    {
     "term": "Equilibrium",
     "definition": "The condition in which the net force on an object is zero",
     "topic": "Free-Body Diagrams and Equilibrium"
    },
    {
     "term": "Contact force",
     "definition": "A force, such as normal force or friction, that arises from two objects physically touching",
     "topic": "Free-Body Diagrams and Equilibrium"
    },
    {
     "term": "Normal force",
     "definition": "The support force a surface exerts perpendicular to itself on an object touching it",
     "topic": "Normal Force and Tension"
    },
    {
     "term": "Tension",
     "definition": "The pulling force transmitted along a string, rope, or cable that is taut",
     "topic": "Normal Force and Tension"
    },
    {
     "term": "Friction",
     "definition": "A force that opposes relative motion or attempted motion between two touching surfaces",
     "topic": "Friction"
    },
    {
     "term": "Static friction",
     "definition": "Friction that prevents a stationary object from starting to move",
     "topic": "Friction"
    },
    {
     "term": "Kinetic friction",
     "definition": "Friction that acts on an object that is already sliding across a surface",
     "topic": "Friction"
    },
    {
     "term": "Friction formula",
     "definition": "F_f = μF_N, where friction force equals the coefficient of friction times the normal force",
     "topic": "Friction"
    }
   ],
   "questions": [
    {
     "id": "phys-u3-q1",
     "type": "mc",
     "prompt": "What is the SI unit of force?",
     "options": [
      "Newton",
      "Joule",
      "Watt",
      "Pascal"
     ],
     "answer": "Newton",
     "explanation": "Force is measured in newtons (N), where 1 N = 1 kg·m/s², defined through Newton's second law.",
     "topic": "Force and Inertia",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q2",
     "type": "mc",
     "prompt": "A net force of 20 N is applied to a 4 kg object. What is its acceleration?",
     "options": [
      "5 m/s²",
      "4 m/s²",
      "80 m/s²",
      "0.2 m/s²"
     ],
     "answer": "5 m/s²",
     "explanation": "Using F = ma, a = F/m = 20 N ÷ 4 kg = 5 m/s².",
     "topic": "Newton's Second Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q3",
     "type": "mc",
     "prompt": "A passenger in a car lurches forward when the car suddenly brakes. Which of Newton's laws best explains this?",
     "options": [
      "The first law (inertia)",
      "The second law (F = ma)",
      "The third law (action-reaction)",
      "The law of universal gravitation"
     ],
     "answer": "The first law (inertia)",
     "explanation": "The passenger's body tends to keep moving forward at its original velocity until a force (seatbelt, friction) acts on it, which is inertia described by the first law.",
     "topic": "Force and Inertia",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q4",
     "type": "mc",
     "prompt": "A 60 kg astronaut travels from Earth to the Moon, where gravity is weaker. How does the astronaut's mass on the Moon compare to on Earth?",
     "options": [
      "It stays the same",
      "It becomes six times greater",
      "It becomes one-sixth as much",
      "It cannot be determined without more information"
     ],
     "answer": "It stays the same",
     "explanation": "Mass measures the amount of matter in an object and does not depend on location, unlike weight, which depends on local gravity.",
     "topic": "Mass and Weight",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q5",
     "type": "mc",
     "prompt": "What is the weight of a 10 kg object on Earth? Use g = 9.8 m/s².",
     "options": [
      "98 N",
      "10 N",
      "9.8 N",
      "980 N"
     ],
     "answer": "98 N",
     "explanation": "Weight is W = mg = 10 kg × 9.8 m/s² = 98 N.",
     "topic": "Mass and Weight",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q6",
     "type": "mc",
     "prompt": "A swimmer pushes water backward with their arms. According to Newton's third law, the water pushes the swimmer in which direction?",
     "options": [
      "Forward",
      "Backward",
      "Downward",
      "The water exerts no force on the swimmer"
     ],
     "answer": "Forward",
     "explanation": "Newton's third law says the reaction force is equal in magnitude and opposite in direction to the action force, so pushing water backward results in a forward force on the swimmer.",
     "topic": "Newton's Third Law",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q7",
     "type": "mc",
     "prompt": "Which pair of forces is a true Newton's third law action-reaction pair?",
     "options": [
      "A rocket pushes exhaust gas back; the gas pushes the rocket forward",
      "Gravity pulls a book down; a table's normal force pushes it up",
      "Road friction pushes a car forward; air resistance pushes it back",
      "Tension pulls a hanging lamp up; gravity pulls the lamp down"
     ],
     "answer": "A rocket pushes exhaust gas back; the gas pushes the rocket forward",
     "explanation": "Action-reaction pairs act on two different objects (here, the rocket and the gas). Each other option pairs two forces acting on the same object (the book, the car or the lamp), so those are not third-law pairs.",
     "topic": "Newton's Third Law",
     "difficulty": "hard"
    },
    {
     "id": "phys-u3-q8",
     "type": "mc",
     "prompt": "A book rests on a table. The table pushes up on the book with a normal force. What is the Newton's third law reaction force to this normal force?",
     "options": [
      "The book pushing down on the table",
      "Earth's gravity pulling the book down",
      "The table's own weight on the floor",
      "The book's inertia"
     ],
     "answer": "The book pushing down on the table",
     "explanation": "By Newton's third law, the book must exert an equal and opposite force on the table, pushing down on it.",
     "topic": "Newton's Third Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q9",
     "type": "mc",
     "prompt": "In a free-body diagram of a single object, which of the following is typically NOT shown?",
     "options": [
      "Internal forces within the object",
      "Forces acting on the object from outside",
      "The direction of each force as an arrow",
      "The relative size of each force"
     ],
     "answer": "Internal forces within the object",
     "explanation": "A free-body diagram only shows external forces acting on the object, not forces between the object's own internal parts.",
     "topic": "Free-Body Diagrams and Equilibrium",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q10",
     "type": "mc",
     "prompt": "An object is in equilibrium when:",
     "options": [
      "Its net force is zero",
      "Its velocity is always zero",
      "It has no mass",
      "It is not touching any surface"
     ],
     "answer": "Its net force is zero",
     "explanation": "Equilibrium means all the forces on an object balance out to a net force of zero; the object can be at rest or moving at constant velocity.",
     "topic": "Free-Body Diagrams and Equilibrium",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q11",
     "type": "mc",
     "prompt": "You push a heavy crate with 50 N of force, but it does not move because friction also exerts 50 N on it. What type of friction is acting on the crate?",
     "options": [
      "Static friction",
      "Kinetic friction",
      "Rolling friction",
      "Air resistance"
     ],
     "answer": "Static friction",
     "explanation": "Static friction acts on objects that are not sliding, and it adjusts up to a maximum value to prevent motion, matching the applied force here.",
     "topic": "Friction",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q12",
     "type": "mc",
     "prompt": "A 20 kg box slides across a floor with a coefficient of kinetic friction of 0.3. Using g = 9.8 m/s², what is the friction force on the box?",
     "options": [
      "58.8 N",
      "196 N",
      "6 N",
      "65.3 N"
     ],
     "answer": "58.8 N",
     "explanation": "First find the normal force: F_N = mg = 20 kg × 9.8 m/s² = 196 N. Then F_f = μF_N = 0.3 × 196 N = 58.8 N.",
     "topic": "Friction",
     "difficulty": "hard"
    },
    {
     "id": "phys-u3-q13",
     "type": "mc",
     "prompt": "Which pair of surfaces would most likely have the highest coefficient of friction between them?",
     "options": [
      "Rubber on dry concrete",
      "Ice on ice",
      "Steel on wet ice",
      "Teflon on Teflon"
     ],
     "answer": "Rubber on dry concrete",
     "explanation": "Rough, high-grip surfaces like rubber on dry concrete resist sliding much more than smooth or lubricated surfaces like ice or Teflon, giving a higher coefficient of friction.",
     "topic": "Friction",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q14",
     "type": "mc",
     "prompt": "A lamp hangs motionless from a rope attached to the ceiling. The force the rope exerts on the lamp is called:",
     "options": [
      "Tension",
      "Normal force",
      "Weight",
      "Friction"
     ],
     "answer": "Tension",
     "explanation": "Tension is the pulling force transmitted through a rope, string, or cable, such as the rope holding up the lamp.",
     "topic": "Normal Force and Tension",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q15",
     "type": "mc",
     "prompt": "A book sits on a ramp tilted at an angle above the horizontal. Compared to the book's actual weight, the normal force from the ramp on the book is:",
     "options": [
      "Less than the book's weight",
      "Equal to the book's weight",
      "Greater than the book's weight",
      "Zero, since the surface is tilted"
     ],
     "answer": "Less than the book's weight",
     "explanation": "On an incline, the normal force only balances the component of weight perpendicular to the surface (mg cos θ), which is less than the full weight mg.",
     "topic": "Normal Force and Tension",
     "difficulty": "hard"
    },
    {
     "id": "phys-u3-q16",
     "type": "mc",
     "prompt": "A 2 kg object accelerates at 3 m/s² to the right due to a 10 N push to the right and a friction force opposing it. What is the size of the friction force?",
     "options": [
      "4 N",
      "6 N",
      "10 N",
      "16 N"
     ],
     "answer": "4 N",
     "explanation": "The net force needed is F_net = ma = 2 kg × 3 m/s² = 6 N. Since the push is 10 N, friction must be 10 N − 6 N = 4 N, acting opposite to the motion.",
     "topic": "Newton's Second Law",
     "difficulty": "hard"
    },
    {
     "id": "phys-u3-q17",
     "type": "tf",
     "prompt": "Newton's first law states that an object in motion will eventually slow down and stop on its own, even with no forces acting on it.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Newton's first law actually states that an object in motion stays in motion at constant velocity unless acted on by a net force; it does not stop on its own.",
     "topic": "Force and Inertia",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q18",
     "type": "tf",
     "prompt": "Mass is measured in kilograms and does not change based on an object's location.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Mass is a measure of the amount of matter in an object and stays constant regardless of where the object is, unlike weight.",
     "topic": "Mass and Weight",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q19",
     "type": "tf",
     "prompt": "Weight is measured in kilograms.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Weight is a force, so it is measured in newtons (N); kilograms is the unit for mass.",
     "topic": "Mass and Weight",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q20",
     "type": "tf",
     "prompt": "According to Newton's third law, action-reaction force pairs act on the same object.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Action-reaction pairs always act on two different objects, not the same one; that is why the forces don't cancel each other out.",
     "topic": "Newton's Third Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q21",
     "type": "tf",
     "prompt": "For a given pair of surfaces, the coefficient of static friction is usually greater than or equal to the coefficient of kinetic friction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "It generally takes more force to start an object sliding than to keep it sliding, so static friction coefficients are typically equal to or larger than kinetic ones.",
     "topic": "Friction",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q22",
     "type": "tf",
     "prompt": "An object can be in equilibrium even while it is moving, as long as it moves at a constant velocity.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Equilibrium requires zero net force, which is satisfied both by objects at rest and objects moving at constant velocity (zero acceleration).",
     "topic": "Free-Body Diagrams and Equilibrium",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q23",
     "type": "tf",
     "prompt": "The normal force on an object is always equal to that object's weight.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The normal force only equals weight in simple cases, like an object at rest on a flat horizontal surface with no other vertical forces; it differs on inclines or when other forces act vertically.",
     "topic": "Normal Force and Tension",
     "difficulty": "hard"
    },
    {
     "id": "phys-u3-q24",
     "type": "written",
     "prompt": "A net force of 36 N acts on an 8 kg cart. What is the cart's acceleration?",
     "answer": "4.5 m/s^2",
     "accept": [
      "4.5",
      "4.5 m/s²",
      "4.5 m/s2",
      "4.5m/s^2",
      "4.5 m/s/s",
      "4.5 meters per second squared",
      "4.5 metres per second squared",
      "4.5 meters per second per second"
     ],
     "explanation": "Using F = ma, a = F/m = 36 N ÷ 8 kg = 4.5 m/s² (check: 8 × 4.5 = 36).",
     "topic": "Newton's Second Law",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q25",
     "type": "written",
     "prompt": "What is the weight of a 5 kg object on Earth? Use g = 9.8 m/s².",
     "answer": "49 N",
     "accept": [
      "49",
      "49 newtons",
      "49 newton"
     ],
     "explanation": "Weight is W = mg = 5 kg × 9.8 m/s² = 49 N.",
     "topic": "Mass and Weight",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q26",
     "type": "written",
     "prompt": "A 1000 kg car accelerates at 2 m/s². What net force is required to produce this acceleration?",
     "answer": "2000 N",
     "accept": [
      "2000",
      "2000 newtons",
      "2000 newton",
      "2000newtons",
      "2 x 10^3 N",
      "2 x 10^3",
      "2 kN"
     ],
     "explanation": "Using F = ma, F = 1000 kg × 2 m/s² = 2000 N.",
     "topic": "Newton's Second Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u3-q27",
     "type": "written",
     "prompt": "What one-word term describes an object's tendency to resist changes in its state of motion?",
     "answer": "Inertia",
     "accept": [],
     "explanation": "Inertia is the property of matter that makes an object resist starting, stopping, or changing its motion; it is the basis of Newton's first law.",
     "topic": "Force and Inertia",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q28",
     "type": "mc",
     "prompt": "A skater pushes on a wall with a force of 100 N. According to Newton's third law, what force does the wall exert on the skater?",
     "answer": "100 N, pointing away from the wall",
     "accept": [],
     "explanation": "Forces come in equal and opposite pairs: the skater pushes the wall with 100 N, so the wall pushes the skater with 100 N in the opposite direction, away from the wall.",
     "topic": "Newton's Third Law",
     "difficulty": "medium",
     "options": [
      "100 N, pointing away from the wall",
      "100 N, pointing toward the wall",
      "Less than 100 N, because the wall does not move",
      "No force, because a wall cannot push"
     ]
    },
    {
     "id": "phys-u3-q29",
     "type": "written",
     "prompt": "A 4.0 kg box rests on a horizontal table, with no other vertical forces acting on it. What is the normal force on the box? (Use g = 9.8 m/s².)",
     "answer": "39.2 N",
     "accept": [
      "39.2",
      "39.2 newtons",
      "39.2 newton"
     ],
     "explanation": "On a flat surface with no other vertical forces, the normal force balances the weight: N = mg = 4.0 kg × 9.8 m/s² = 39.2 N.",
     "topic": "Normal Force and Tension",
     "difficulty": "easy"
    },
    {
     "id": "phys-u3-q30",
     "type": "written",
     "prompt": "A 5 kg wooden block rests on a horizontal floor where the coefficient of static friction is 0.4. Using g = 9.8 m/s², what is the maximum static friction force before the block starts to slide?",
     "answer": "19.6 N",
     "accept": [
      "19.6",
      "19.6 newtons",
      "19.6 newton"
     ],
     "explanation": "First find the normal force: F_N = mg = 5 kg × 9.8 m/s² = 49 N. Then the maximum static friction is F_f = μF_N = 0.4 × 49 N = 19.6 N.",
     "topic": "Friction",
     "difficulty": "hard"
    }
   ]
  },
  {
   "id": "phys-u4",
   "unit": 4,
   "title": "Circular Motion and Gravitation",
   "summary": "Explore why objects moving in circles are always accelerating, and how a real, center-seeking centripetal force—not a mythical \"centrifugal force\"—keeps them on their curved path. Then extend these ideas to gravity, covering Newton's law of universal gravitation, gravitational fields, weightlessness, and Kepler's three laws of planetary motion.",
   "topics": [
    "Uniform Circular Motion",
    "Period and Frequency",
    "Centripetal Force and Acceleration",
    "Newton's Law of Gravitation",
    "Gravitational Field and Weightlessness",
    "Orbits and Kepler's Laws"
   ],
   "terms": [
    {
     "term": "Uniform circular motion",
     "definition": "Movement along a circular path at constant speed, even though the direction of velocity keeps changing.",
     "topic": "Uniform Circular Motion"
    },
    {
     "term": "Centripetal",
     "definition": "Directed toward the center of a circular path.",
     "topic": "Uniform Circular Motion"
    },
    {
     "term": "Tangential velocity",
     "definition": "A circling object's instantaneous speed and direction, along the line that just touches the circle at that point.",
     "topic": "Uniform Circular Motion"
    },
    {
     "term": "Centrifugal \"force\"",
     "definition": "An apparent outward push felt in a rotating frame; not a real force, but an effect of inertia.",
     "topic": "Uniform Circular Motion"
    },
    {
     "term": "Period (T)",
     "definition": "The time required to complete one full revolution or cycle.",
     "topic": "Period and Frequency"
    },
    {
     "term": "Frequency (f)",
     "definition": "The number of revolutions or cycles completed per unit time.",
     "topic": "Period and Frequency"
    },
    {
     "term": "Period-frequency relationship",
     "definition": "T = 1/f",
     "topic": "Period and Frequency"
    },
    {
     "term": "Centripetal acceleration formula",
     "definition": "a_c = v²/r",
     "topic": "Centripetal Force and Acceleration"
    },
    {
     "term": "Centripetal force",
     "definition": "The net force, directed toward the center of the circle, that causes an object to move in a circular path.",
     "topic": "Centripetal Force and Acceleration"
    },
    {
     "term": "Centripetal force formula",
     "definition": "F_c = mv²/r",
     "topic": "Centripetal Force and Acceleration"
    },
    {
     "term": "Newton's law of universal gravitation",
     "definition": "Any two masses attract with a force proportional to the product of their masses and inversely proportional to distance squared.",
     "topic": "Newton's Law of Gravitation"
    },
    {
     "term": "Universal gravitational constant (G)",
     "definition": "The proportionality constant in the law of gravitation, about 6.67 x 10^-11 N·m²/kg².",
     "topic": "Newton's Law of Gravitation"
    },
    {
     "term": "Inverse-square law",
     "definition": "A relationship where strength is proportional to 1/r², so doubling the distance reduces the effect to one-fourth.",
     "topic": "Newton's Law of Gravitation"
    },
    {
     "term": "Universal gravitation formula",
     "definition": "F = Gm₁m₂/r²",
     "topic": "Newton's Law of Gravitation"
    },
    {
     "term": "Gravitational field strength (g)",
     "definition": "The gravitational force acting per unit mass at a location in space.",
     "topic": "Gravitational Field and Weightlessness"
    },
    {
     "term": "Weightlessness",
     "definition": "The sensation of having no weight, experienced during free fall when nothing supports the body.",
     "topic": "Gravitational Field and Weightlessness"
    },
    {
     "term": "Apparent weight",
     "definition": "The force a scale or support actually registers on an object, which can differ from its true gravitational weight.",
     "topic": "Gravitational Field and Weightlessness"
    },
    {
     "term": "Free fall",
     "definition": "Motion in which gravity is the only force acting on an object.",
     "topic": "Gravitational Field and Weightlessness"
    },
    {
     "term": "Orbit",
     "definition": "The closed path a smaller body follows around a larger one, with gravity supplying the centripetal force.",
     "topic": "Orbits and Kepler's Laws"
    },
    {
     "term": "Geosynchronous orbit",
     "definition": "An orbit with a period matching Earth's rotation, about 24 hours, keeping a satellite above one longitude.",
     "topic": "Orbits and Kepler's Laws"
    },
    {
     "term": "Kepler's First Law",
     "definition": "Planets travel in elliptical orbits with the Sun at one focus.",
     "topic": "Orbits and Kepler's Laws"
    },
    {
     "term": "Kepler's Second Law",
     "definition": "A line joining a planet to the Sun sweeps out equal areas in equal time intervals.",
     "topic": "Orbits and Kepler's Laws"
    },
    {
     "term": "Kepler's Third Law",
     "definition": "The square of a planet's orbital period is proportional to the cube of its average orbital radius.",
     "topic": "Orbits and Kepler's Laws"
    }
   ],
   "questions": [
    {
     "id": "phys-u4-q1",
     "type": "mc",
     "prompt": "In uniform circular motion, which quantity remains constant over time?",
     "options": [
      "Speed",
      "Velocity",
      "Acceleration",
      "Direction of motion"
     ],
     "answer": "Speed",
     "explanation": "Speed (the magnitude of velocity) stays constant in uniform circular motion, but the direction of velocity constantly changes, so velocity and acceleration are not constant.",
     "topic": "Uniform Circular Motion",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q2",
     "type": "mc",
     "prompt": "A car travels around a perfectly circular track at a constant speed. Which statement correctly describes its motion?",
     "options": [
      "Its velocity is constant because its speed doesn't change",
      "Its acceleration is zero because its speed is constant",
      "It is accelerating because its velocity direction is changing",
      "It experiences no net force since its speed is constant"
     ],
     "answer": "It is accelerating because its velocity direction is changing",
     "explanation": "Acceleration is any change in velocity, and even at constant speed, a continuously changing direction counts as acceleration (centripetal acceleration).",
     "topic": "Uniform Circular Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q3",
     "type": "tf",
     "prompt": "In uniform circular motion, an object's velocity remains constant because its speed does not change.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Velocity includes direction as well as magnitude; even though speed stays the same, the direction of motion constantly changes, so velocity is not constant.",
     "topic": "Uniform Circular Motion",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q4",
     "type": "tf",
     "prompt": "Centrifugal force is a fictitious force that only appears to act on an object when viewed from a rotating (non-inertial) reference frame.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "In an inertial (non-rotating) frame, only the real, center-seeking centripetal force acts; the outward 'centrifugal force' is just an apparent effect of inertia seen from inside the rotating frame.",
     "topic": "Uniform Circular Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q5",
     "type": "written",
     "prompt": "In a rotating reference frame, objects seem to be pushed outward away from the center. What is the name commonly given to this apparent, non-real force?",
     "answer": "centrifugal force",
     "accept": [
      "the centrifugal force",
      "centrifugal",
      "the centrifugal"
     ],
     "explanation": "This apparent outward push is actually the object's own inertia tending to keep it moving in a straight line while the frame rotates around it; it is not a real force.",
     "topic": "Uniform Circular Motion",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q6",
     "type": "mc",
     "prompt": "A passenger sitting in a car that suddenly turns left feels pushed toward the right side of their seat. What actually causes this sensation?",
     "options": [
      "A real centrifugal force pushing the passenger outward",
      "The passenger's inertia, which tends to keep them moving in a straight line while the car turns",
      "Friction between the road and tires pushing the passenger sideways",
      "A decrease in the passenger's weight during the turn"
     ],
     "answer": "The passenger's inertia, which tends to keep them moving in a straight line while the car turns",
     "explanation": "The passenger's body tends to continue moving in a straight line due to inertia while the car curves beneath them, so the seat pushes into the passenger, which feels like an outward push.",
     "topic": "Uniform Circular Motion",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q7",
     "type": "written",
     "prompt": "A fan blade completes one full rotation every 0.25 seconds. What is its frequency of rotation, in hertz?",
     "answer": "4 Hz",
     "accept": [
      "4",
      "4.0 Hz",
      "4 hertz",
      "4.0 hertz"
     ],
     "explanation": "Frequency is the reciprocal of period: f = 1/T = 1/0.25 s = 4 Hz.",
     "topic": "Period and Frequency",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q8",
     "type": "mc",
     "prompt": "Which equation correctly relates an object's period (T) to its frequency (f)?",
     "options": [
      "T = 1/f",
      "T = f",
      "T = 2πf",
      "T = f²"
     ],
     "answer": "T = 1/f",
     "explanation": "Period and frequency are reciprocals of one another: a longer period means fewer cycles per second, so T = 1/f.",
     "topic": "Period and Frequency",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q9",
     "type": "written",
     "prompt": "A wheel spins with a frequency of 5 Hz. What is its period, in seconds?",
     "answer": "0.2 s",
     "accept": [
      "0.2",
      "0.2 seconds",
      "0.20 s"
     ],
     "explanation": "Period is the reciprocal of frequency: T = 1/f = 1/5 Hz = 0.2 s.",
     "topic": "Period and Frequency",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q10",
     "type": "tf",
     "prompt": "If the period of an object's revolution increases, its frequency also increases.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Period and frequency are inversely related (T = 1/f), so a longer period corresponds to a lower frequency, not a higher one.",
     "topic": "Period and Frequency",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q11",
     "type": "mc",
     "prompt": "A carousel completes 15 full revolutions in 60 seconds. What is its period of revolution?",
     "options": [
      "4 s",
      "15 s",
      "0.25 s",
      "60 s"
     ],
     "answer": "4 s",
     "explanation": "Period is the time per revolution: 60 s divided by 15 revolutions gives 60/15 = 4 s per revolution.",
     "topic": "Period and Frequency",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q12",
     "type": "mc",
     "prompt": "Which formula correctly gives the centripetal acceleration of an object moving in a circle of radius r at speed v?",
     "options": [
      "a = v²/r",
      "a = v/r",
      "a = v²r",
      "a = 2πr/T"
     ],
     "answer": "a = v²/r",
     "explanation": "Centripetal acceleration depends on the square of the object's speed divided by the radius of its circular path: a = v²/r.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q13",
     "type": "written",
     "prompt": "A ball moves in a circle of radius 2.0 m at a constant speed of 4.0 m/s. Calculate its centripetal acceleration, in m/s², rounded to one decimal place.",
     "answer": "8.0 m/s^2",
     "accept": [
      "8",
      "8.0",
      "8 m/s^2",
      "8 m/s2",
      "8.0 meters per second squared"
     ],
     "explanation": "a = v²/r = (4.0 m/s)² / 2.0 m = 16/2.0 = 8.0 m/s².",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q14",
     "type": "mc",
     "prompt": "A 2.0 kg object moves in a circle of radius 0.50 m at a constant speed of 3.0 m/s. What centripetal force is required to keep it on this path?",
     "options": [
      "36 N",
      "18 N",
      "12 N",
      "9 N"
     ],
     "answer": "36 N",
     "explanation": "F = mv²/r = (2.0 kg)(3.0 m/s)²/(0.50 m) = (2.0)(9.0)/0.50 = 18/0.50 = 36 N.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q15",
     "type": "tf",
     "prompt": "If the radius of an object's circular path stays the same, doubling the object's speed multiplies the required centripetal force by a factor of four.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since F = mv²/r, force depends on the square of speed; doubling v multiplies v² (and thus F) by 2² = 4.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q16",
     "type": "written",
     "prompt": "A 0.20 kg ball on a string moves in a horizontal circle of radius 0.80 m. The string provides a centripetal force of 5.0 N. What is the ball's speed, in m/s, rounded to two significant figures?",
     "answer": "4.5 m/s",
     "accept": [
      "4.5",
      "4.5 meters per second"
     ],
     "explanation": "Solving F = mv²/r for v gives v = √(Fr/m) = √((5.0)(0.80)/0.20) = √20 ≈ 4.5 m/s.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q17",
     "type": "mc",
     "prompt": "A car makes a turn on a flat, dry road. What force provides the centripetal force that keeps the car on its curved path?",
     "options": [
      "Gravity",
      "Normal force",
      "Friction between the tires and road",
      "The car's engine"
     ],
     "answer": "Friction between the tires and road",
     "explanation": "On a flat road, static friction between the tires and the road surface supplies the center-directed force needed to turn the car.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q18",
     "type": "mc",
     "prompt": "In uniform circular motion, what is the direction of the centripetal acceleration relative to the object's instantaneous velocity?",
     "options": [
      "Perpendicular to the velocity, pointing toward the center",
      "Parallel to the velocity, in the same direction",
      "Parallel to the velocity, in the opposite direction",
      "There is no fixed relationship between them"
     ],
     "answer": "Perpendicular to the velocity, pointing toward the center",
     "explanation": "Centripetal acceleration always points toward the circle's center, which is perpendicular to the tangential velocity at every instant.",
     "topic": "Centripetal Force and Acceleration",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q19",
     "type": "mc",
     "prompt": "According to Newton's law of universal gravitation, the gravitational force between two objects is proportional to what?",
     "options": [
      "The product of the masses, divided by the square of the distance between them",
      "The sum of the masses, divided by the distance between them",
      "The product of the masses, divided by the distance between them",
      "The product of the masses, multiplied by the square of the distance between them"
     ],
     "answer": "The product of the masses, divided by the square of the distance between them",
     "explanation": "Newton's law states F = Gm₁m₂/r², so force scales with the product of the two masses and falls off with the square of their separation.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q20",
     "type": "tf",
     "prompt": "If the distance between two masses is tripled, the gravitational force between them becomes one-third as strong.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Gravity follows an inverse-square law, so tripling the distance reduces the force to 1/3² = 1/9 of its original strength, not 1/3.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q21",
     "type": "written",
     "prompt": "Two objects with masses 2.0 kg and 3.0 kg are 1.0 m apart. Using G = 6.67 x 10^-11 N·m²/kg², calculate the gravitational force between them, in newtons, rounded to two significant figures and written in scientific notation.",
     "answer": "4.0 x 10^-10 N",
     "accept": [
      "4.0 x 10^-10",
      "4.0e-10 N",
      "4.0e-10",
      "4 x 10^-10 N",
      "4 x 10^-10",
      "4.0 x 10^-10 newtons",
      "4 x 10^-10 newtons"
     ],
     "explanation": "F = Gm₁m₂/r² = (6.67×10⁻¹¹)(2.0)(3.0)/(1.0)² = (6.67×10⁻¹¹)(6.0) = 4.0×10⁻¹⁰ N.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q22",
     "type": "mc",
     "prompt": "If the mass of one of two gravitationally interacting objects is doubled while the distance between them stays the same, what happens to the gravitational force between them?",
     "options": [
      "It doubles",
      "It quadruples",
      "It is halved",
      "It stays the same"
     ],
     "answer": "It doubles",
     "explanation": "Gravitational force is directly proportional to each mass, so doubling one mass while holding everything else fixed doubles the force.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q23",
     "type": "mc",
     "prompt": "If the distance between two fixed masses is cut in half, what happens to the gravitational force between them?",
     "options": [
      "It is halved",
      "It doubles",
      "It quadruples",
      "It is quartered"
     ],
     "answer": "It quadruples",
     "explanation": "Because gravity follows an inverse-square law, halving the distance (r → r/2) increases the force by a factor of 1/(1/2)² = 4.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q24",
     "type": "written",
     "prompt": "What is the approximate value of the universal gravitational constant, G, in N·m²/kg²? Give it in scientific notation, rounded to two significant figures.",
     "answer": "6.7 x 10^-11 N*m^2/kg^2",
     "accept": [
      "6.7 x 10^-11",
      "6.7e-11",
      "6.67 x 10^-11",
      "6.67e-11",
      "6.7 x 10^-11 N m^2/kg^2",
      "6.67 x 10^-11 N m^2/kg^2"
     ],
     "explanation": "G ≈ 6.67 × 10⁻¹¹ N·m²/kg² is the experimentally measured universal gravitational constant, here rounded to 6.7 × 10⁻¹¹.",
     "topic": "Newton's Law of Gravitation",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q25",
     "type": "mc",
     "prompt": "How is gravitational field strength (g) at a location defined?",
     "options": [
      "Gravitational force per unit mass at that location",
      "Gravitational force per unit distance from the center",
      "The total gravitational force on all objects at that location",
      "The planet's mass divided by its radius"
     ],
     "answer": "Gravitational force per unit mass at that location",
     "explanation": "Gravitational field strength is g = F/m, the force experienced per kilogram of mass, which is numerically equal to the gravitational acceleration at that point.",
     "topic": "Gravitational Field and Weightlessness",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q26",
     "type": "tf",
     "prompt": "Astronauts orbiting Earth in a space station feel weightless because gravity is still acting on them, but they and the station are in continuous free fall together.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Gravity supplies the centripetal force for the orbit, so the astronauts and station continuously fall toward Earth together, producing the sensation of weightlessness even though gravity still acts.",
     "topic": "Gravitational Field and Weightlessness",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q27",
     "type": "mc",
     "prompt": "Why do astronauts orbiting Earth experience apparent weightlessness?",
     "options": [
      "They have traveled beyond the reach of Earth's gravitational field",
      "They and their spacecraft are in continuous free fall around Earth",
      "The spacecraft's hull blocks gravitational force from reaching them",
      "Earth's gravity is too weak at orbital altitude to have any effect"
     ],
     "answer": "They and their spacecraft are in continuous free fall around Earth",
     "explanation": "In orbit, gravity acts as the centripetal force, so the astronauts and craft fall freely together, which removes the sensation of weight even though gravity still acts on them.",
     "topic": "Gravitational Field and Weightlessness",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q28",
     "type": "written",
     "prompt": "Earth's gravitational field strength at the surface is about 9.8 N/kg. What is the weight of a 15 kg object at Earth's surface, in newtons?",
     "answer": "147 N",
     "accept": [
      "147",
      "147 newtons",
      "147.0 N"
     ],
     "explanation": "Weight equals mass times gravitational field strength: W = mg = 15 kg × 9.8 N/kg = 147 N.",
     "topic": "Gravitational Field and Weightlessness",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q29",
     "type": "mc",
     "prompt": "How does gravitational field strength change as distance from the center of a planet increases?",
     "options": [
      "It increases linearly with distance",
      "It decreases with the square of the distance",
      "It stays constant regardless of distance",
      "It decreases linearly with distance"
     ],
     "answer": "It decreases with the square of the distance",
     "explanation": "Since g = GM/r², gravitational field strength follows an inverse-square relationship with distance from the planet's center.",
     "topic": "Gravitational Field and Weightlessness",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q30",
     "type": "mc",
     "prompt": "According to Kepler's First Law, what is the shape of a planet's orbit around the Sun?",
     "options": [
      "A perfect circle centered on the Sun",
      "An ellipse with the Sun at one focus",
      "A parabola that never repeats",
      "A spiral that slowly shrinks"
     ],
     "answer": "An ellipse with the Sun at one focus",
     "explanation": "Kepler's First Law states that planetary orbits are ellipses, not perfect circles, with the Sun located at one of the two foci.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q31",
     "type": "tf",
     "prompt": "According to Kepler's Second Law, a planet moves fastest when it is at its farthest point from the Sun.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Kepler's Second Law (equal areas swept in equal times) means a planet moves fastest at its closest approach to the Sun, not its farthest point.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q32",
     "type": "mc",
     "prompt": "Which expression correctly states Kepler's Third Law, relating a planet's orbital period (T) to its average orbital radius (r)?",
     "options": [
      "T² ∝ r³",
      "T ∝ r²",
      "T³ ∝ r²",
      "T ∝ r³"
     ],
     "answer": "T² ∝ r³",
     "explanation": "Kepler's Third Law states that the square of a planet's orbital period is proportional to the cube of its average orbital radius.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q33",
     "type": "written",
     "prompt": "Planet A orbits a star at radius r. Planet B orbits the same star at radius 4r. Using Kepler's Third Law (T² is proportional to r³), what is the ratio of Planet B's orbital period to Planet A's orbital period?",
     "answer": "8",
     "accept": [
      "8:1",
      "8 times",
      "8x",
      "8 to 1"
     ],
     "explanation": "Since T² ∝ r³, (T_B/T_A)² = (4r/r)³ = 4³ = 64, so T_B/T_A = √64 = 8.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "hard"
    },
    {
     "id": "phys-u4-q34",
     "type": "mc",
     "prompt": "What force provides the centripetal force that keeps an orbiting satellite on its curved path around Earth?",
     "options": [
      "Air resistance from Earth's atmosphere",
      "The satellite's engines firing continuously",
      "Earth's gravitational pull on the satellite",
      "The satellite's own inertia alone"
     ],
     "answer": "Earth's gravitational pull on the satellite",
     "explanation": "Gravity between Earth and the satellite continuously pulls the satellite toward Earth's center, acting as the centripetal force that keeps it on its curved path.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "medium"
    },
    {
     "id": "phys-u4-q35",
     "type": "tf",
     "prompt": "A geosynchronous satellite has an orbital period of about 24 hours, matching Earth's rotation period.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A geosynchronous orbit is defined by a period equal to Earth's rotational period, roughly 24 hours, so the satellite stays above the same region of longitude.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "easy"
    },
    {
     "id": "phys-u4-q36",
     "type": "written",
     "prompt": "What is the name of the point in a planet's elliptical orbit where it is closest to the Sun?",
     "answer": "perihelion",
     "accept": [],
     "explanation": "Perihelion is the point of closest approach to the Sun in an elliptical orbit; the farthest point in the orbit is called aphelion.",
     "topic": "Orbits and Kepler's Laws",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "phys-u5",
   "unit": 5,
   "title": "Work, Energy and Power",
   "summary": "Learn how force and motion combine to do work, and how energy shows up as motion (kinetic), position (gravitational and elastic potential), and rate of transfer (power). Practice calculating work, energy, power, and machine efficiency in real-world scenarios while applying conservation of mechanical energy and the work-energy theorem.",
   "topics": [
    "Work",
    "Kinetic Energy",
    "Potential Energy",
    "Conservation of Energy",
    "Power",
    "Machines & Efficiency"
   ],
   "terms": [
    {
     "term": "Work",
     "definition": "The transfer of energy to an object by a force acting through a displacement, equal to F d cos θ.",
     "topic": "Work"
    },
    {
     "term": "Joule",
     "definition": "The SI unit of energy and work, equal to one newton-meter (N·m).",
     "topic": "Work"
    },
    {
     "term": "Negative work",
     "definition": "Energy removed from an object by a force that has a component opposite to its displacement (angle between force and displacement greater than 90°).",
     "topic": "Work"
    },
    {
     "term": "Kinetic energy",
     "definition": "The energy an object has because of its motion, equal to one-half its mass times its speed squared.",
     "topic": "Kinetic Energy"
    },
    {
     "term": "Work-energy theorem",
     "definition": "The rule stating that the net work done on an object equals its change in kinetic energy.",
     "topic": "Kinetic Energy"
    },
    {
     "term": "Gravitational potential energy",
     "definition": "Energy stored in an object due to its height above a chosen reference level, equal to mgh.",
     "topic": "Potential Energy"
    },
    {
     "term": "Elastic potential energy",
     "definition": "Energy stored in a stretched or compressed spring or other elastic object.",
     "topic": "Potential Energy"
    },
    {
     "term": "Hooke's Law",
     "definition": "The rule that the force required to stretch or compress a spring is proportional to its displacement, F = kx.",
     "topic": "Potential Energy"
    },
    {
     "term": "Spring constant",
     "definition": "A number, k, that measures a spring's stiffness in the equation F = kx, measured in N/m.",
     "topic": "Potential Energy"
    },
    {
     "term": "Equilibrium position",
     "definition": "The position where a spring is neither stretched nor compressed, so it exerts no elastic force.",
     "topic": "Potential Energy"
    },
    {
     "term": "Mechanical energy",
     "definition": "The sum of an object's kinetic energy and potential energy.",
     "topic": "Conservation of Energy"
    },
    {
     "term": "Law of conservation of energy",
     "definition": "The principle that energy cannot be created or destroyed, only converted between forms.",
     "topic": "Conservation of Energy"
    },
    {
     "term": "Conservation of mechanical energy",
     "definition": "The rule that KE + PE stays constant when friction and other non-conservative forces do no work.",
     "topic": "Conservation of Energy"
    },
    {
     "term": "Non-conservative force",
     "definition": "A force, such as friction or air resistance, whose work depends on the path taken and which changes a system's mechanical energy, often removing it as heat.",
     "topic": "Conservation of Energy"
    },
    {
     "term": "Energy conversion",
     "definition": "The change of energy from one form to another, such as potential energy becoming kinetic energy.",
     "topic": "Conservation of Energy"
    },
    {
     "term": "Power",
     "definition": "The rate at which work is done or energy is transferred, equal to work divided by time.",
     "topic": "Power"
    },
    {
     "term": "Watt",
     "definition": "The SI unit of power, equal to one joule per second.",
     "topic": "Power"
    },
    {
     "term": "Horsepower",
     "definition": "A common non-SI unit of power, equal to about 746 watts, often used to rate engines.",
     "topic": "Power"
    },
    {
     "term": "Simple machine",
     "definition": "A device, such as a lever or pulley, that changes the size or direction of an input force to make work easier.",
     "topic": "Machines & Efficiency"
    },
    {
     "term": "Mechanical advantage",
     "definition": "The factor by which a machine multiplies an input force, equal to output force divided by input force.",
     "topic": "Machines & Efficiency"
    },
    {
     "term": "Efficiency",
     "definition": "The ratio of useful output work or energy to total input work or energy, often expressed as a percentage.",
     "topic": "Machines & Efficiency"
    },
    {
     "term": "Ideal machine",
     "definition": "A hypothetical machine with no friction, in which output work exactly equals input work.",
     "topic": "Machines & Efficiency"
    }
   ],
   "questions": [
    {
     "id": "phys-u5-q1",
     "type": "mc",
     "prompt": "A person pushes a box across the floor with a constant 50 N force, moving it 4 m in the direction of the force. How much work does the person do on the box?",
     "options": [
      "50 J",
      "200 J",
      "54 J",
      "4 J"
     ],
     "answer": "200 J",
     "explanation": "Work equals force times distance in the direction of the force: W = F × d = 50 N × 4 m = 200 J.",
     "topic": "Work",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q2",
     "type": "mc",
     "prompt": "A worker pulls a sled using a rope held at 30° above the horizontal, applying 100 N of force while the sled slides 5 m horizontally. Using cos 30° ≈ 0.866, how much work does the applied force do (rounded to the nearest joule)?",
     "options": [
      "500 J",
      "433 J",
      "250 J",
      "58 J"
     ],
     "answer": "433 J",
     "explanation": "W = F d cos θ = 100 N × 5 m × 0.866 ≈ 433 J; only the force component along the direction of motion does work.",
     "topic": "Work",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q3",
     "type": "mc",
     "prompt": "A force acts on a moving object such that it is always perpendicular to the object's displacement (for example, the tension in a ball swung in a horizontal circle). How much work does this force do on the object?",
     "options": [
      "Zero work, because cos 90° = 0",
      "Maximum work, because the force is strong",
      "Negative work, because the object curves",
      "It depends only on the object's mass"
     ],
     "answer": "Zero work, because cos 90° = 0",
     "explanation": "Work is W = Fd cos θ; when the force is perpendicular to displacement, θ = 90° and cos 90° = 0, so no work is done.",
     "topic": "Work",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q4",
     "type": "tf",
     "prompt": "If you push as hard as you can against a solid wall and the wall does not move at all, you have done zero work on the wall.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Work requires displacement (W = Fd); since the wall's displacement is zero, the work done on it is zero no matter how large the force is.",
     "topic": "Work",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q5",
     "type": "written",
     "prompt": "A constant force does 150 J of work moving an object 3 m in the direction of the force. What is the magnitude of the force?",
     "answer": "50 N",
     "accept": [
      "50",
      "50 newtons"
     ],
     "explanation": "F = W/d = 150 J / 3 m = 50 N.",
     "topic": "Work",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q6",
     "type": "written",
     "prompt": "A 20 N force is applied to an object at an angle of 60° to its 10 m displacement. Using cos 60° = 0.5, how much work does the force do (in joules)?",
     "answer": "100 J",
     "accept": [
      "100",
      "100 joules"
     ],
     "explanation": "W = F d cos θ = 20 N × 10 m × 0.5 = 100 J.",
     "topic": "Work",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q7",
     "type": "mc",
     "prompt": "What is the kinetic energy of a 2 kg object moving at 3 m/s?",
     "options": [
      "3 J",
      "18 J",
      "9 J",
      "27 J"
     ],
     "answer": "9 J",
     "explanation": "KE = ½mv² = ½ × 2 kg × (3 m/s)² = ½ × 2 × 9 = 9 J.",
     "topic": "Kinetic Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q8",
     "type": "mc",
     "prompt": "If an object's speed doubles while its mass stays the same, what happens to its kinetic energy?",
     "options": [
      "It doubles",
      "It stays the same",
      "It quadruples",
      "It increases by half"
     ],
     "answer": "It quadruples",
     "explanation": "KE = ½mv², so KE depends on v²; doubling v multiplies KE by 2² = 4, meaning it quadruples.",
     "topic": "Kinetic Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q9",
     "type": "mc",
     "prompt": "A 1000 kg car traveling at 20 m/s brakes to a stop over a distance of 50 m. Using the work-energy theorem, what is the magnitude of the average braking force?",
     "options": [
      "10,000 N",
      "400 N",
      "8000 N",
      "4000 N"
     ],
     "answer": "4000 N",
     "explanation": "KE_initial = ½mv² = ½ × 1000 kg × (20 m/s)² = 200,000 J. Since the car stops, the braking force does −200,000 J of work: F = W/d = 200,000 J / 50 m = 4000 N.",
     "topic": "Kinetic Energy",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q10",
     "type": "tf",
     "prompt": "Because kinetic energy depends on the square of an object's speed, tripling an object's speed (with mass unchanged) increases its kinetic energy by a factor of 9.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "KE = ½mv²; tripling v multiplies KE by 3² = 9, so the statement is correct.",
     "topic": "Kinetic Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q11",
     "type": "written",
     "prompt": "What is the kinetic energy, in joules, of a 5 kg object moving at 4 m/s?",
     "answer": "40 J",
     "accept": [
      "40",
      "40 joules"
     ],
     "explanation": "KE = ½mv² = ½ × 5 kg × (4 m/s)² = ½ × 5 × 16 = 40 J.",
     "topic": "Kinetic Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q12",
     "type": "written",
     "prompt": "An object has 50 J of kinetic energy. A net force then does 300 J of work on it. According to the work-energy theorem, what is the object's final kinetic energy?",
     "answer": "350 J",
     "accept": [
      "350",
      "350 joules",
      "350 joule"
     ],
     "explanation": "The work-energy theorem says W_net = ΔKE, so KE_final = KE_initial + W_net = 50 J + 300 J = 350 J.",
     "topic": "Kinetic Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q13",
     "type": "mc",
     "prompt": "What is the gravitational potential energy of a 10 kg object raised 5 m above the ground? (Use g = 9.8 m/s².)",
     "options": [
      "50 J",
      "98 J",
      "500 J",
      "490 J"
     ],
     "answer": "490 J",
     "explanation": "PE = mgh = 10 kg × 9.8 m/s² × 5 m = 490 J.",
     "topic": "Potential Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q14",
     "type": "mc",
     "prompt": "A spring has a spring constant of 200 N/m. Using Hooke's Law, how much force is needed to stretch it 0.15 m from its equilibrium position?",
     "options": [
      "3 N",
      "215 N",
      "15 N",
      "30 N"
     ],
     "answer": "30 N",
     "explanation": "By Hooke's Law, F = kx = 200 N/m × 0.15 m = 30 N.",
     "topic": "Potential Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q15",
     "type": "mc",
     "prompt": "A spring with a spring constant of 150 N/m is compressed 0.2 m from equilibrium. Using PE = ½kx², how much elastic potential energy is stored in the spring?",
     "options": [
      "30 J",
      "15 J",
      "6 J",
      "3 J"
     ],
     "answer": "3 J",
     "explanation": "PE = ½kx² = ½ × 150 N/m × (0.2 m)² = ½ × 150 × 0.04 = 3 J.",
     "topic": "Potential Energy",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q16",
     "type": "tf",
     "prompt": "Because elastic potential energy stored in a spring depends on the square of its displacement, doubling the displacement from equilibrium doubles the stored elastic potential energy.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "PE = ½kx², so doubling x multiplies PE by 2² = 4 (it quadruples), not 2, since the relationship is squared, not linear.",
     "topic": "Potential Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q17",
     "type": "tf",
     "prompt": "Gravitational potential energy has exactly the same numeric value no matter where the reference height (h = 0) is chosen.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "PE = mgh is measured relative to a chosen reference level, so its numeric value changes if a different h = 0 point is chosen, even though the change in PE between two points stays the same.",
     "topic": "Potential Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q18",
     "type": "written",
     "prompt": "A 2 kg object is lifted 3 m above the ground. Using g = 9.8 m/s², calculate its gravitational potential energy.",
     "answer": "58.8 J",
     "accept": [
      "58.8",
      "58.8 joules"
     ],
     "explanation": "PE = mgh = 2 kg × 9.8 m/s² × 3 m = 58.8 J.",
     "topic": "Potential Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q19",
     "type": "mc",
     "prompt": "A ball falls freely toward the ground with no air resistance. As it falls, what happens to its total mechanical energy?",
     "options": [
      "It decreases",
      "It increases",
      "It stays constant",
      "It converts entirely to kinetic energy immediately"
     ],
     "answer": "It stays constant",
     "explanation": "With no air resistance (no non-conservative forces), mechanical energy is conserved: potential energy converts to kinetic energy, but the total stays constant.",
     "topic": "Conservation of Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q20",
     "type": "mc",
     "prompt": "A 2 kg ball is dropped from rest at a height of 10 m. Ignoring air resistance and using g = 9.8 m/s², what is its speed just before hitting the ground?",
     "options": [
      "9.8 m/s",
      "10 m/s",
      "196 m/s",
      "14 m/s"
     ],
     "answer": "14 m/s",
     "explanation": "By conservation of energy, mgh = ½mv², so v = √(2gh) = √(2 × 9.8 × 10) = √196 = 14 m/s.",
     "topic": "Conservation of Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q21",
     "type": "mc",
     "prompt": "A skier slides down a hill that has friction, compared to an identical frictionless hill of the same height. At the bottom of the hill, the skier's speed will be...",
     "options": [
      "Higher",
      "The same",
      "Zero regardless of height",
      "Lower"
     ],
     "answer": "Lower",
     "explanation": "Friction is a non-conservative force that converts some mechanical energy into heat, leaving less kinetic energy at the bottom, so the skier's speed is lower.",
     "topic": "Conservation of Energy",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q22",
     "type": "tf",
     "prompt": "Mechanical energy is conserved only when non-conservative forces, such as friction or air resistance, do no work on the system.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Non-conservative forces that do work (like friction or air resistance) change the mechanical energy, usually turning some of it into heat. So mechanical energy stays constant only when such forces do no work. A force can act and still do no work, like the tension on a swinging pendulum, which is always perpendicular to the motion.",
     "topic": "Conservation of Energy",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q23",
     "type": "written",
     "prompt": "A pendulum bob is released from rest at a height of 2.0 m above its lowest point, with no friction. Using g = 9.8 m/s², find its speed at the lowest point (round to the nearest tenth of a m/s).",
     "answer": "6.3 m/s",
     "accept": [
      "6.3",
      "6.3 meters per second"
     ],
     "explanation": "By energy conservation, mgh = ½mv², so v = √(2gh) = √(2 × 9.8 × 2.0) = √39.2 ≈ 6.3 m/s.",
     "topic": "Conservation of Energy",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q24",
     "type": "written",
     "prompt": "Total mechanical energy is the sum of an object's kinetic energy and its _____ energy. (Give the one-word type of energy.)",
     "answer": "potential",
     "accept": [
      "potential energy",
      "PE"
     ],
     "explanation": "Mechanical energy = kinetic energy + potential energy, the two forms combined in a mechanical system.",
     "topic": "Conservation of Energy",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q25",
     "type": "mc",
     "prompt": "A motor does 600 J of work in 5 seconds. What is its power output?",
     "options": [
      "3000 W",
      "100 W",
      "125 W",
      "120 W"
     ],
     "answer": "120 W",
     "explanation": "Power is the rate of doing work: P = W/t = 600 J / 5 s = 120 W.",
     "topic": "Power",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q26",
     "type": "mc",
     "prompt": "A 60 W light bulb is left on for 2 minutes (120 seconds). How much energy does it use?",
     "options": [
      "120 J",
      "3600 J",
      "14,400 J",
      "7200 J"
     ],
     "answer": "7200 J",
     "explanation": "Energy = power × time = 60 W × 120 s = 7200 J. Remember to convert 2 minutes to 120 seconds first.",
     "topic": "Power",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q27",
     "type": "tf",
     "prompt": "Power is defined as the total amount of work done on an object, without regard to how long the work takes.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Power is the rate at which work is done, P = W/t, so time is an essential part of the definition, not something power ignores.",
     "topic": "Power",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q28",
     "type": "written",
     "prompt": "A crane lifts a 500 kg load a height of 10 m in 25 s. Using g = 9.8 m/s², calculate the crane's power output (round to the nearest watt).",
     "answer": "1960 W",
     "accept": [
      "1960",
      "1960 watts"
     ],
     "explanation": "Work = mgh = 500 kg × 9.8 m/s² × 10 m = 49,000 J. Power = W/t = 49,000 J / 25 s = 1960 W.",
     "topic": "Power",
     "difficulty": "hard"
    },
    {
     "id": "phys-u5-q29",
     "type": "mc",
     "prompt": "What does the mechanical advantage of a simple machine measure?",
     "options": [
      "How much energy the machine saves overall",
      "How fast the machine can operate",
      "How much heat the machine produces",
      "How much the machine multiplies the input force"
     ],
     "answer": "How much the machine multiplies the input force",
     "explanation": "Mechanical advantage is the ratio of output (load) force to input (effort) force, showing how much a machine multiplies the applied force.",
     "topic": "Machines & Efficiency",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q30",
     "type": "mc",
     "prompt": "A lever produces an output force of 300 N from an input force of 60 N. What is its mechanical advantage?",
     "options": [
      "0.2",
      "240",
      "360",
      "5"
     ],
     "answer": "5",
     "explanation": "Mechanical advantage = output force / input force = 300 N / 60 N = 5.",
     "topic": "Machines & Efficiency",
     "difficulty": "medium"
    },
    {
     "id": "phys-u5-q31",
     "type": "tf",
     "prompt": "No real machine can be 100% efficient, because some of the input energy is always lost, usually as heat due to friction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Friction and other resistive effects in real machines always convert some input energy to heat or sound, so useful output energy is always less than input energy.",
     "topic": "Machines & Efficiency",
     "difficulty": "easy"
    },
    {
     "id": "phys-u5-q32",
     "type": "tf",
     "prompt": "A pulley system has a work input of 500 J and a useful work output of 400 J, giving it an efficiency of 125%.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Efficiency = output/input × 100% = 400/500 × 100% = 80%, not 125%; also, no real machine can exceed 100% efficiency.",
     "topic": "Machines & Efficiency",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "phys-u6",
   "unit": 6,
   "title": "Momentum and Collisions",
   "summary": "Explore how momentum (p = mv) and impulse (J = FΔt = Δp) describe motion and its changes. See why airbags protect people by lengthening stopping time, and why follow-through increases the impulse given to a ball. Use conservation of momentum to analyze elastic, inelastic, and perfectly inelastic collisions, plus explosions and recoil.",
   "topics": [
    "Momentum Basics",
    "Impulse and Impulse-Momentum Theorem",
    "Impulse in Real Life",
    "Conservation of Momentum",
    "Collision Types",
    "Explosions and Recoil"
   ],
   "terms": [
    {
     "term": "Momentum",
     "definition": "The product of an object's mass and velocity, a vector quantity measured in kg·m/s.",
     "topic": "Momentum Basics"
    },
    {
     "term": "Momentum formula",
     "definition": "p = mv, where m is mass in kg and v is velocity in m/s.",
     "topic": "Momentum Basics"
    },
    {
     "term": "Vector quantity",
     "definition": "A measurement that has both magnitude and direction, such as velocity or momentum.",
     "topic": "Momentum Basics"
    },
    {
     "term": "Impulse",
     "definition": "The product of the net force on an object and the time interval over which it acts, J = FΔt.",
     "topic": "Impulse and Impulse-Momentum Theorem"
    },
    {
     "term": "Impulse-momentum theorem",
     "definition": "The principle that the impulse on an object equals its change in momentum, J = Δp.",
     "topic": "Impulse and Impulse-Momentum Theorem"
    },
    {
     "term": "Newton-second (N·s)",
     "definition": "The SI unit of impulse, equivalent to the momentum unit kg·m/s.",
     "topic": "Impulse and Impulse-Momentum Theorem"
    },
    {
     "term": "Change in momentum (Δp)",
     "definition": "The difference between an object's final and initial momentum, calculated as mvf − mvi.",
     "topic": "Impulse and Impulse-Momentum Theorem"
    },
    {
     "term": "Airbag",
     "definition": "A cushion that inflates in a crash, lengthening a passenger's stopping time to lower the average force.",
     "topic": "Impulse in Real Life"
    },
    {
     "term": "Follow-through",
     "definition": "Continuing a swing after contact to lengthen contact time, increasing the impulse given to an object.",
     "topic": "Impulse in Real Life"
    },
    {
     "term": "Crumple zone",
     "definition": "A section of a vehicle designed to collapse gradually in a crash, extending collision time and lowering the force on occupants.",
     "topic": "Impulse in Real Life"
    },
    {
     "term": "Law of conservation of momentum",
     "definition": "The total momentum of an isolated system stays constant if no net external force acts on it.",
     "topic": "Conservation of Momentum"
    },
    {
     "term": "Isolated system",
     "definition": "A group of objects on which no net external force acts, so their total momentum stays constant.",
     "topic": "Conservation of Momentum"
    },
    {
     "term": "Newton's third law",
     "definition": "For every action force, there is an equal and opposite reaction force, which underlies why interacting objects share total momentum.",
     "topic": "Conservation of Momentum"
    },
    {
     "term": "Conservation equation for two objects",
     "definition": "m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′, relating a two-object system's motion before and after interaction.",
     "topic": "Conservation of Momentum"
    },
    {
     "term": "Elastic collision",
     "definition": "A collision in which both total momentum and total kinetic energy are conserved.",
     "topic": "Collision Types"
    },
    {
     "term": "Inelastic collision",
     "definition": "A collision in which total momentum is conserved but total kinetic energy is not.",
     "topic": "Collision Types"
    },
    {
     "term": "Perfectly inelastic collision",
     "definition": "A collision in which the colliding objects stick together and move with one common final velocity.",
     "topic": "Collision Types"
    },
    {
     "term": "Kinetic energy",
     "definition": "The energy an object has due to its motion, given by KE = ½mv².",
     "topic": "Collision Types"
    },
    {
     "term": "Explosion",
     "definition": "An event in which one object separates into two or more pieces that move apart, with total momentum conserved.",
     "topic": "Explosions and Recoil"
    },
    {
     "term": "Recoil",
     "definition": "The backward motion of an object, such as a gun, resulting from conservation of momentum when it launches another object forward.",
     "topic": "Explosions and Recoil"
    },
    {
     "term": "Center of mass",
     "definition": "The mass-weighted average position of a system; it moves at constant velocity when no net external force acts.",
     "topic": "Explosions and Recoil"
    }
   ],
   "questions": [
    {
     "id": "phys-u6-q1",
     "type": "mc",
     "prompt": "A 2.0 kg cart moves at 3.0 m/s. What is its momentum?",
     "options": [
      "6.0 kg·m/s",
      "5.0 kg·m/s",
      "1.5 kg·m/s",
      "9.0 kg·m/s"
     ],
     "answer": "6.0 kg·m/s",
     "explanation": "Momentum is p = mv, so p = 2.0 kg × 3.0 m/s = 6.0 kg·m/s.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q2",
     "type": "mc",
     "prompt": "Which of the following is a vector quantity?",
     "options": [
      "Momentum",
      "Mass",
      "Speed",
      "Kinetic energy"
     ],
     "answer": "Momentum",
     "explanation": "Momentum has both a magnitude (mv) and a direction, unlike mass, speed, or kinetic energy, which are scalars.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q3",
     "type": "mc",
     "prompt": "A 0.50 kg ball moving at 4.0 m/s is struck by a bat and stops in 0.10 s. What is the magnitude of the average force the bat exerts on the ball?",
     "options": [
      "20 N",
      "2.0 N",
      "0.20 N",
      "200 N"
     ],
     "answer": "20 N",
     "explanation": "Impulse equals the change in momentum: Δp = 0.50 kg × (0 − 4.0 m/s) = −2.0 kg·m/s. Force = Δp/Δt = 2.0/0.10 = 20 N.",
     "topic": "Impulse and Impulse-Momentum Theorem",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q4",
     "type": "mc",
     "prompt": "A 10 N force acts on an object for 4 s. Which of these force-and-time combinations produces the same impulse?",
     "options": [
      "20 N for 2 s",
      "10 N for 8 s",
      "5 N for 4 s",
      "8 N for 6 s"
     ],
     "answer": "20 N for 2 s",
     "explanation": "The given impulse is 10 N × 4 s = 40 N·s. Only 20 N × 2 s = 40 N·s matches; the others give 80, 20, and 48 N·s.",
     "topic": "Impulse and Impulse-Momentum Theorem",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q5",
     "type": "mc",
     "prompt": "Why do airbags reduce injury to passengers in a car crash?",
     "options": [
      "They increase the time over which the passenger's momentum changes, reducing the average force",
      "They increase the force needed to stop the passenger, so the passenger comes to rest more quickly",
      "They decrease the total change in the passenger's momentum, so less impulse is needed to stop them",
      "They increase the passenger's effective mass, so the passenger's velocity changes by a smaller amount"
     ],
     "answer": "They increase the time over which the passenger's momentum changes, reducing the average force",
     "explanation": "The impulse (change in momentum) needed to stop the passenger is roughly fixed, so stretching the stopping time over a longer Δt lowers the average force, since F = Δp/Δt.",
     "topic": "Impulse in Real Life",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q6",
     "type": "mc",
     "prompt": "A tennis player follows through after hitting the ball, keeping the racket in contact longer. What effect does this have?",
     "options": [
      "It increases the contact time, increasing the impulse and the ball's speed",
      "It decreases the contact time, which increases the force on the ball",
      "It has no effect on the impulse, because the force on the ball stays the same",
      "It reduces the momentum transferred, because the racket slows down during contact"
     ],
     "answer": "It increases the contact time, increasing the impulse and the ball's speed",
     "explanation": "Since J = FΔt, a longer contact time (Δt) at a similar force delivers a larger impulse, giving the ball more momentum and speed.",
     "topic": "Impulse in Real Life",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q7",
     "type": "mc",
     "prompt": "A 3.0 kg cart moving at 4.0 m/s collides with a stationary 1.0 kg cart and sticks to it. What is their common velocity after the collision?",
     "options": [
      "3.0 m/s",
      "4.0 m/s",
      "1.0 m/s",
      "2.0 m/s"
     ],
     "answer": "3.0 m/s",
     "explanation": "Total momentum before = 3.0 kg × 4.0 m/s + 1.0 kg × 0 = 12 kg·m/s. After sticking, total mass = 4.0 kg, so v = 12/4.0 = 3.0 m/s.",
     "topic": "Conservation of Momentum",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q8",
     "type": "mc",
     "prompt": "Two 50 kg skaters push off from rest on frictionless ice. Skater A moves left at 2.0 m/s. What is skater B's velocity?",
     "options": [
      "2.0 m/s to the right",
      "2.0 m/s to the left",
      "4.0 m/s to the right",
      "1.0 m/s to the right"
     ],
     "answer": "2.0 m/s to the right",
     "explanation": "Total momentum starts at zero, so 50 kg × (−2.0 m/s) + 50 kg × vB = 0, giving vB = +2.0 m/s, meaning 2.0 m/s to the right.",
     "topic": "Conservation of Momentum",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q9",
     "type": "mc",
     "prompt": "A 2.0 kg ball moving at 3.0 m/s collides elastically, head-on, with an identical stationary 2.0 kg ball. What happens right after the collision?",
     "options": [
      "The first ball stops and the second ball moves at 3.0 m/s",
      "Both balls move together at 1.5 m/s",
      "The first ball continues at 3.0 m/s and the second stays at rest",
      "The first ball bounces back at 3.0 m/s"
     ],
     "answer": "The first ball stops and the second ball moves at 3.0 m/s",
     "explanation": "In an elastic collision between equal masses where one is initially at rest, the objects exchange velocities, so the moving ball stops and the resting ball takes on its speed of 3.0 m/s.",
     "topic": "Collision Types",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q10",
     "type": "mc",
     "prompt": "Which type of collision conserves both total momentum and total kinetic energy?",
     "options": [
      "Elastic collision",
      "Inelastic collision",
      "Perfectly inelastic collision",
      "Explosive collision"
     ],
     "answer": "Elastic collision",
     "explanation": "An elastic collision is defined as one where both momentum and kinetic energy are conserved; the other collision types conserve momentum only.",
     "topic": "Collision Types",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q11",
     "type": "mc",
     "prompt": "A 1000 kg car moving at 20 m/s hits a stationary 1000 kg car, and the two crumple together and move as one mass. What type of collision is this?",
     "options": [
      "Perfectly inelastic",
      "Elastic",
      "Inelastic but not perfectly inelastic",
      "Explosive"
     ],
     "answer": "Perfectly inelastic",
     "explanation": "Because the vehicles stick together and share one final velocity, this fits the definition of a perfectly inelastic collision.",
     "topic": "Collision Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q12",
     "type": "mc",
     "prompt": "A 1000 kg car moving at 20 m/s collides and sticks with an identical stationary 1000 kg car. How much kinetic energy is lost in the collision?",
     "options": [
      "1.0 x 10^5 J",
      "2.0 x 10^5 J",
      "5.0 x 10^4 J",
      "0 J"
     ],
     "answer": "1.0 x 10^5 J",
     "explanation": "Initial KE = ½(1000)(20²) = 200,000 J. Final common velocity = (1000×20)/2000 = 10 m/s, so final KE = ½(2000)(10²) = 100,000 J. Lost KE = 200,000 − 100,000 = 1.0 x 10^5 J.",
     "topic": "Collision Types",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q13",
     "type": "mc",
     "prompt": "A stationary 5.0 kg rifle fires a 0.010 kg bullet forward at 300 m/s. What is the magnitude of the rifle's recoil speed?",
     "options": [
      "0.60 m/s",
      "3.0 m/s",
      "0.060 m/s",
      "6.0 m/s"
     ],
     "answer": "0.60 m/s",
     "explanation": "Total momentum stays zero: bullet momentum = 0.010 kg × 300 m/s = 3.0 kg·m/s, so the rifle gets −3.0 kg·m/s. Rifle speed = 3.0/5.0 = 0.60 m/s.",
     "topic": "Explosions and Recoil",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q14",
     "type": "mc",
     "prompt": "An object initially at rest explodes into two pieces that fly apart. What is the total momentum of the two pieces immediately after the explosion?",
     "options": [
      "Equal to zero, the same as before the explosion",
      "Equal to the sum of the kinetic energies of the pieces",
      "Greater than zero",
      "Dependent on which piece is heavier"
     ],
     "answer": "Equal to zero, the same as before the explosion",
     "explanation": "Momentum is conserved in the explosion, so the total momentum after must equal the total momentum before, which was zero since the object was at rest.",
     "topic": "Explosions and Recoil",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q15",
     "type": "mc",
     "prompt": "A 1500 kg car moving east at 10 m/s collides head-on with a 1000 kg car moving west at 8 m/s, and they stick together. Taking east as positive, what is their velocity right after the collision?",
     "options": [
      "2.8 m/s east",
      "2.8 m/s west",
      "1.4 m/s east",
      "4.0 m/s east"
     ],
     "answer": "2.8 m/s east",
     "explanation": "Total momentum = 1500(10) + 1000(−8) = 15000 − 8000 = 7000 kg·m/s. Total mass = 2500 kg, so v = 7000/2500 = 2.8 m/s, positive means east.",
     "topic": "Conservation of Momentum",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q16",
     "type": "mc",
     "prompt": "Which has greater momentum: a 1000 kg car moving at 2 m/s, or a 2 kg ball moving at 500 m/s?",
     "options": [
      "The car, since 1000×2 = 2000 kg·m/s exceeds the ball's 2×500 = 1000 kg·m/s",
      "The ball, since 2×500 = 1000 kg·m/s exceeds the car's 1000×2 = 2000 kg·m/s",
      "They are equal, since both equal 1000 kg·m/s",
      "The ball, because momentum increases faster with speed than with mass"
     ],
     "answer": "The car, since 1000×2 = 2000 kg·m/s exceeds the ball's 2×500 = 1000 kg·m/s",
     "explanation": "The car's momentum is 1000 kg × 2 m/s = 2000 kg·m/s, while the ball's is 2 kg × 500 m/s = 1000 kg·m/s, so the car has more momentum.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q17",
     "type": "tf",
     "prompt": "Momentum is a scalar quantity, meaning it only has a magnitude and no direction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Momentum is a vector quantity because it depends on velocity, which has direction, so momentum has both magnitude and direction.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q18",
     "type": "tf",
     "prompt": "The SI unit of impulse, the newton-second, is equivalent to the SI unit of momentum, the kilogram-meter per second.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A newton is a kg·m/s², so a newton-second reduces to kg·m/s, the same unit used for momentum.",
     "topic": "Impulse and Impulse-Momentum Theorem",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q19",
     "type": "tf",
     "prompt": "In a perfectly inelastic collision, total kinetic energy is conserved.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Perfectly inelastic collisions conserve momentum, but kinetic energy is generally lost to deformation, heat, and sound as the objects stick together.",
     "topic": "Collision Types",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q20",
     "type": "tf",
     "prompt": "The law of conservation of momentum states that the total momentum of an isolated system stays constant if no net external force acts on it.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the definition of conservation of momentum: without an external net force, the total momentum of the system cannot change.",
     "topic": "Conservation of Momentum",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q21",
     "type": "tf",
     "prompt": "Airbags reduce injury by decreasing the total impulse delivered to a passenger during a crash.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "The impulse needed to stop the passenger's momentum is roughly the same with or without an airbag; the airbag instead spreads that impulse over a longer time to lower the peak force.",
     "topic": "Impulse in Real Life",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q22",
     "type": "tf",
     "prompt": "In an explosion, the total momentum of all the fragments right after the explosion equals the total momentum of the object right before it.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "No external force acts during the brief explosion, so momentum is conserved and the total momentum after must match the total before.",
     "topic": "Explosions and Recoil",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q23",
     "type": "tf",
     "prompt": "Elastic collisions conserve momentum but not kinetic energy.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Elastic collisions are defined as conserving both momentum and kinetic energy; only momentum is guaranteed to be conserved in inelastic collisions.",
     "topic": "Collision Types",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q24",
     "type": "written",
     "prompt": "A 4.0 kg object has a momentum of 12 kg·m/s. What is its velocity?",
     "answer": "3.0 m/s",
     "accept": [
      "3.0",
      "3",
      "3 m/s",
      "3 meters per second",
      "3.0 meters per second"
     ],
     "explanation": "Since p = mv, v = p/m = 12 kg·m/s ÷ 4.0 kg = 3.0 m/s.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q25",
     "type": "written",
     "prompt": "A net force of 50 N acts on an object for 4.0 s. What is the magnitude of the impulse delivered?",
     "answer": "200 N·s",
     "accept": [
      "200",
      "200 Ns",
      "200 N s",
      "200 N*s",
      "200 N.s",
      "200 N-s",
      "200 newton-seconds",
      "200 newton seconds",
      "200 newton-second",
      "200 newton second",
      "200 kg·m/s",
      "200 kg m/s",
      "200 kg*m/s",
      "200 kg.m/s"
     ],
     "explanation": "Impulse equals force times time: J = FΔt = 50 N × 4.0 s = 200 N·s.",
     "topic": "Impulse and Impulse-Momentum Theorem",
     "difficulty": "medium"
    },
    {
     "id": "phys-u6-q26",
     "type": "written",
     "prompt": "What is the term for an event in which an object at rest breaks apart into pieces that fly outward, with total momentum conserved?",
     "answer": "Explosion",
     "accept": [
      "an explosion"
     ],
     "explanation": "This event is called an explosion; even though the object separates, the total momentum of all the pieces still sums to the original value.",
     "topic": "Explosions and Recoil",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q27",
     "type": "written",
     "prompt": "What quantity is found by multiplying an object's mass by its velocity?",
     "answer": "Momentum",
     "accept": [
      "linear momentum"
     ],
     "explanation": "Mass times velocity defines momentum, p = mv, a measure of how hard it is to stop a moving object.",
     "topic": "Momentum Basics",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q28",
     "type": "written",
     "prompt": "A 6.0 kg object moving at 5.0 m/s is acted on by a force that changes its momentum to 18 kg·m/s (same direction) after 3.0 s. What is the magnitude of the average force applied?",
     "answer": "4.0 N",
     "accept": [
      "4",
      "4.0",
      "4 N",
      "4 newtons",
      "4.0 newtons"
     ],
     "explanation": "Initial momentum = 6.0 kg × 5.0 m/s = 30 kg·m/s. Change in momentum = 18 − 30 = −12 kg·m/s. Force = Δp/Δt = 12/3.0 = 4.0 N.",
     "topic": "Impulse and Impulse-Momentum Theorem",
     "difficulty": "hard"
    },
    {
     "id": "phys-u6-q29",
     "type": "written",
     "prompt": "What is the name for a collision in which two objects bounce apart and both total momentum and total kinetic energy are conserved?",
     "answer": "Elastic collision",
     "accept": [
      "elastic",
      "an elastic collision"
     ],
     "explanation": "A collision that conserves both momentum and kinetic energy is called elastic, unlike inelastic collisions where kinetic energy is lost.",
     "topic": "Collision Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u6-q30",
     "type": "written",
     "prompt": "A 0.20 kg toy car moving at 2.5 m/s collides perfectly inelastically with a stationary 0.30 kg toy car. Find their common velocity after the collision, rounded to two significant figures.",
     "answer": "1.0 m/s",
     "accept": [
      "1",
      "1.0",
      "1 m/s",
      "1 meter per second",
      "1.0 meters per second"
     ],
     "explanation": "Momentum before = 0.20 kg × 2.5 m/s = 0.50 kg·m/s. Total mass after sticking = 0.50 kg, so v = 0.50/0.50 = 1.0 m/s.",
     "topic": "Collision Types",
     "difficulty": "medium"
    }
   ]
  },
  {
   "id": "phys-u7",
   "unit": 7,
   "title": "Waves and Sound",
   "summary": "Explore how mechanical and electromagnetic waves carry energy, from amplitude and wavelength to reflection, refraction, diffraction, and interference. Learn how sound behaves as a longitudinal wave, including pitch, loudness, decibels, standing waves, the Doppler effect, and resonance.",
   "topics": [
    "Wave Basics & Types",
    "Wave Properties",
    "Wave Behaviors",
    "Interference & Standing Waves",
    "Sound Waves",
    "Doppler Effect & Resonance"
   ],
   "terms": [
    {
     "term": "Mechanical wave",
     "definition": "A wave that requires a physical medium, such as air or water, in order to travel.",
     "topic": "Wave Basics & Types"
    },
    {
     "term": "Electromagnetic wave",
     "definition": "A wave that can travel through a vacuum without needing any medium.",
     "topic": "Wave Basics & Types"
    },
    {
     "term": "Transverse wave",
     "definition": "A wave in which particles of the medium move perpendicular to the direction of travel.",
     "topic": "Wave Basics & Types"
    },
    {
     "term": "Longitudinal wave",
     "definition": "A wave in which particles of the medium move parallel to the direction of travel.",
     "topic": "Wave Basics & Types"
    },
    {
     "term": "Amplitude",
     "definition": "The maximum displacement of a particle from its rest position.",
     "topic": "Wave Properties"
    },
    {
     "term": "Wavelength",
     "definition": "The distance between two consecutive identical points on a wave, such as crest to crest.",
     "topic": "Wave Properties"
    },
    {
     "term": "Frequency",
     "definition": "The number of complete wave cycles that pass a fixed point each second.",
     "topic": "Wave Properties"
    },
    {
     "term": "Period",
     "definition": "The time required for one complete wave cycle to occur.",
     "topic": "Wave Properties"
    },
    {
     "term": "Crest",
     "definition": "The highest point of a transverse wave above its rest position.",
     "topic": "Wave Properties"
    },
    {
     "term": "Trough",
     "definition": "The lowest point of a transverse wave below its rest position.",
     "topic": "Wave Properties"
    },
    {
     "term": "Compression",
     "definition": "A region of a longitudinal wave where particles are pushed close together.",
     "topic": "Wave Properties"
    },
    {
     "term": "Rarefaction",
     "definition": "A region of a longitudinal wave where particles are spread farther apart.",
     "topic": "Wave Properties"
    },
    {
     "term": "Wave speed equation",
     "definition": "v = fλ; a wave's speed equals its frequency multiplied by its wavelength.",
     "topic": "Wave Properties"
    },
    {
     "term": "Reflection",
     "definition": "The bouncing of a wave back into its original medium after hitting a boundary.",
     "topic": "Wave Behaviors"
    },
    {
     "term": "Refraction",
     "definition": "The bending of a wave as it changes speed while entering a new medium.",
     "topic": "Wave Behaviors"
    },
    {
     "term": "Diffraction",
     "definition": "The bending or spreading of waves around obstacles or through narrow openings.",
     "topic": "Wave Behaviors"
    },
    {
     "term": "Constructive interference",
     "definition": "The overlap of waves whose displacements add together to form a larger combined wave.",
     "topic": "Interference & Standing Waves"
    },
    {
     "term": "Destructive interference",
     "definition": "The overlap of waves whose displacements cancel to form a smaller combined wave.",
     "topic": "Interference & Standing Waves"
    },
    {
     "term": "Standing wave",
     "definition": "A stationary-looking pattern formed when two identical waves traveling in opposite directions interfere.",
     "topic": "Interference & Standing Waves"
    },
    {
     "term": "Node",
     "definition": "A point on a standing wave that has zero displacement at all times.",
     "topic": "Interference & Standing Waves"
    },
    {
     "term": "Antinode",
     "definition": "A point on a standing wave with the maximum possible displacement.",
     "topic": "Interference & Standing Waves"
    },
    {
     "term": "Pitch",
     "definition": "The perceived highness or lowness of a sound, determined mainly by frequency.",
     "topic": "Sound Waves"
    },
    {
     "term": "Loudness",
     "definition": "The perceived strength of a sound, determined mainly by its amplitude.",
     "topic": "Sound Waves"
    },
    {
     "term": "Decibel",
     "definition": "The unit used to measure the intensity level of a sound.",
     "topic": "Sound Waves"
    },
    {
     "term": "Doppler effect",
     "definition": "A change in a wave's observed frequency caused by relative motion between source and observer.",
     "topic": "Doppler Effect & Resonance"
    },
    {
     "term": "Resonance",
     "definition": "A large increase in vibration amplitude when a system is driven at its natural frequency.",
     "topic": "Doppler Effect & Resonance"
    }
   ],
   "questions": [
    {
     "id": "phys-u7-q1",
     "type": "mc",
     "prompt": "Which type of wave requires a physical medium (like air, water, or a rope) in order to travel?",
     "options": [
      "Electromagnetic wave",
      "Mechanical wave",
      "Radio wave",
      "Light wave"
     ],
     "answer": "Mechanical wave",
     "explanation": "Mechanical waves transfer energy by making particles of a medium vibrate, so without a medium there is nothing to vibrate. Electromagnetic, radio, and light waves can all travel through empty space.",
     "topic": "Wave Basics & Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q2",
     "type": "mc",
     "prompt": "In a transverse wave, the particles of the medium move:",
     "options": [
      "parallel to the direction the wave travels",
      "perpendicular to the direction the wave travels",
      "in circles around the wave's path",
      "opposite to the direction the wave travels"
     ],
     "answer": "perpendicular to the direction the wave travels",
     "explanation": "Transverse waves (like waves on a string) displace particles at right angles to the wave's travel direction, creating crests and troughs.",
     "topic": "Wave Basics & Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q3",
     "type": "mc",
     "prompt": "Sound waves traveling through air are best classified as:",
     "options": [
      "transverse mechanical waves",
      "longitudinal mechanical waves",
      "transverse electromagnetic waves",
      "longitudinal electromagnetic waves"
     ],
     "answer": "longitudinal mechanical waves",
     "explanation": "Sound needs a medium (air molecules) to travel, so it is mechanical, and air particles vibrate back and forth parallel to the wave's travel direction, so it is longitudinal.",
     "topic": "Wave Basics & Types",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q4",
     "type": "mc",
     "prompt": "The distance from one crest to the next crest on a transverse wave is called the wave's:",
     "options": [
      "amplitude",
      "period",
      "wavelength",
      "frequency"
     ],
     "answer": "wavelength",
     "explanation": "Wavelength is the distance between two consecutive identical points on a wave, such as crest to crest or trough to trough.",
     "topic": "Wave Properties",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q5",
     "type": "mc",
     "prompt": "A wave has a frequency of 5 Hz and a wavelength of 2 m. What is its speed?",
     "options": [
      "2.5 m/s",
      "7 m/s",
      "10 m/s",
      "25 m/s"
     ],
     "answer": "10 m/s",
     "explanation": "Using v = fλ: v = 5 Hz × 2 m = 10 m/s.",
     "topic": "Wave Properties",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q6",
     "type": "mc",
     "prompt": "A wave travels at 340 m/s and has a wavelength of 0.5 m. What is its frequency?",
     "options": [
      "170 Hz",
      "340 Hz",
      "680 Hz",
      "850 Hz"
     ],
     "answer": "680 Hz",
     "explanation": "Rearranging v = fλ gives f = v/λ = 340 m/s ÷ 0.5 m = 680 Hz.",
     "topic": "Wave Properties",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q7",
     "type": "mc",
     "prompt": "A wave has a period of 0.25 s. What is its frequency?",
     "options": [
      "0.25 Hz",
      "2.5 Hz",
      "4 Hz",
      "40 Hz"
     ],
     "answer": "4 Hz",
     "explanation": "Frequency and period are reciprocals: f = 1/T = 1/0.25 s = 4 Hz.",
     "topic": "Wave Properties",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q8",
     "type": "mc",
     "prompt": "A wave bends as it passes from air into water because its speed changes. This behavior is called:",
     "options": [
      "reflection",
      "diffraction",
      "refraction",
      "resonance"
     ],
     "answer": "refraction",
     "explanation": "Refraction is the bending of a wave that occurs when it enters a new medium and changes speed.",
     "topic": "Wave Behaviors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q9",
     "type": "mc",
     "prompt": "A person standing outside an open doorway can hear a conversation inside a room even without a direct line of sight, because sound waves bend around the doorway's edges. This is an example of:",
     "options": [
      "reflection",
      "diffraction",
      "refraction",
      "the Doppler effect"
     ],
     "answer": "diffraction",
     "explanation": "Diffraction is the bending and spreading of waves around obstacles or through openings, which lets sound reach around corners.",
     "topic": "Wave Behaviors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q10",
     "type": "mc",
     "prompt": "An echo heard after shouting toward a cliff is produced mainly by which wave behavior?",
     "options": [
      "refraction",
      "diffraction",
      "reflection",
      "interference"
     ],
     "answer": "reflection",
     "explanation": "An echo occurs when sound waves bounce off a hard surface, such as a cliff, and return to the listener — this is reflection.",
     "topic": "Wave Behaviors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q11",
     "type": "mc",
     "prompt": "Two waves of equal frequency meet so that a crest lines up with a crest, adding their displacements to make a taller crest. This is called:",
     "options": [
      "destructive interference",
      "constructive interference",
      "diffraction",
      "resonance"
     ],
     "answer": "constructive interference",
     "explanation": "When aligned crests (or troughs) combine, their displacements add together, producing a larger amplitude — this is constructive interference.",
     "topic": "Interference & Standing Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q12",
     "type": "mc",
     "prompt": "A crest of one wave meets the trough of another wave of equal amplitude, and the two displacements cancel out. This is called:",
     "options": [
      "constructive interference",
      "destructive interference",
      "refraction",
      "resonance"
     ],
     "answer": "destructive interference",
     "explanation": "When a crest and a trough of equal size overlap, their opposite displacements cancel — this is destructive interference.",
     "topic": "Interference & Standing Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q13",
     "type": "mc",
     "prompt": "On a standing wave pattern, the points that show zero displacement at all times are called:",
     "options": [
      "antinodes",
      "crests",
      "nodes",
      "troughs"
     ],
     "answer": "nodes",
     "explanation": "Nodes are fixed points of a standing wave where destructive interference always occurs, so the medium never moves there.",
     "topic": "Interference & Standing Waves",
     "difficulty": "hard"
    },
    {
     "id": "phys-u7-q14",
     "type": "mc",
     "prompt": "The pitch a listener hears is most directly determined by a sound wave's:",
     "options": [
      "amplitude",
      "frequency",
      "speed",
      "decibel level"
     ],
     "answer": "frequency",
     "explanation": "Pitch is the perception of frequency: higher-frequency sound waves are heard as higher-pitched sounds.",
     "topic": "Sound Waves",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q15",
     "type": "mc",
     "prompt": "If the amplitude of a sound wave is increased while its frequency stays the same, the sound will:",
     "options": [
      "have a higher pitch",
      "have a lower pitch",
      "become louder",
      "travel slower"
     ],
     "answer": "become louder",
     "explanation": "Loudness depends on amplitude (energy/intensity), while pitch depends on frequency, so increasing amplitude alone makes the sound louder, not higher or lower pitched.",
     "topic": "Sound Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q16",
     "type": "mc",
     "prompt": "An ambulance drives toward you with its siren blaring, then passes and drives away. Compared to the siren's true pitch, what do you hear?",
     "options": [
      "The pitch stays constant the whole time",
      "A higher pitch approaching, then a lower pitch after it passes",
      "A lower pitch approaching, then a higher pitch after it passes",
      "No sound at all as it passes"
     ],
     "answer": "A higher pitch approaching, then a lower pitch after it passes",
     "explanation": "As the source approaches, sound waves bunch up in front of it, raising the observed frequency (higher pitch); as it moves away, waves stretch out, lowering the observed frequency — this is the Doppler effect.",
     "topic": "Doppler Effect & Resonance",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q17",
     "type": "mc",
     "prompt": "An opera singer shatters a glass by singing a note that matches the glass's own natural vibration frequency. This phenomenon is called:",
     "options": [
      "diffraction",
      "resonance",
      "refraction",
      "the Doppler effect"
     ],
     "answer": "resonance",
     "explanation": "Resonance occurs when a system is driven at its natural frequency, causing vibration amplitude to grow large enough to shatter the glass.",
     "topic": "Doppler Effect & Resonance",
     "difficulty": "hard"
    },
    {
     "id": "phys-u7-q18",
     "type": "tf",
     "prompt": "Electromagnetic waves, such as light, can travel through empty space (a vacuum) with no medium present.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Unlike mechanical waves, electromagnetic waves do not need particles of a medium to propagate, which is how sunlight reaches Earth through space.",
     "topic": "Wave Basics & Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q19",
     "type": "tf",
     "prompt": "In a longitudinal wave, the particles of the medium vibrate perpendicular to the direction the wave travels.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is false — in a longitudinal wave, particles vibrate parallel to the wave's direction of travel, creating compressions and rarefactions; perpendicular motion describes transverse waves.",
     "topic": "Wave Basics & Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q20",
     "type": "tf",
     "prompt": "Frequency is defined as the number of complete wave cycles that pass a fixed point every second.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "This is the standard definition of frequency, measured in hertz (Hz), where 1 Hz equals one cycle per second.",
     "topic": "Wave Properties",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q21",
     "type": "tf",
     "prompt": "If a wave's speed stays constant, doubling its frequency will also double its wavelength.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is false — since v = fλ, if speed is constant and frequency doubles, wavelength must be cut in half, not doubled.",
     "topic": "Wave Properties",
     "difficulty": "hard"
    },
    {
     "id": "phys-u7-q22",
     "type": "tf",
     "prompt": "Destructive interference happens when the crest of one wave lines up with the trough of another wave, reducing the combined amplitude.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "When a crest and a trough overlap, their opposite displacements subtract from each other, reducing the resulting wave's amplitude.",
     "topic": "Interference & Standing Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q23",
     "type": "tf",
     "prompt": "The decibel (dB) scale is used to measure the pitch of a sound.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is false — decibels measure sound intensity level, which relates to loudness, not pitch; pitch is described by frequency instead.",
     "topic": "Sound Waves",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q24",
     "type": "tf",
     "prompt": "A standing wave forms when two identical waves traveling in opposite directions interfere with each other.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Standing waves arise from the interference of two identical waves (same frequency and amplitude) moving toward each other, often from a wave and its reflection.",
     "topic": "Interference & Standing Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q25",
     "type": "tf",
     "prompt": "In the Doppler effect, a moving sound source actually emits a different frequency than it would if it were standing still.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "This is false — the source's actual emitted frequency never changes; only the frequency an observer perceives changes because of the relative motion between source and observer.",
     "topic": "Doppler Effect & Resonance",
     "difficulty": "hard"
    },
    {
     "id": "phys-u7-q26",
     "type": "written",
     "prompt": "What is the term for a wave that does NOT require a medium to travel, such as light or radio waves?",
     "answer": "Electromagnetic wave",
     "accept": [
      "electromagnetic waves",
      "electromagnetic",
      "em wave",
      "em waves",
      "em",
      "electromagnetic radiation"
     ],
     "explanation": "Electromagnetic waves are produced by oscillating electric and magnetic fields, which do not need particles of matter to propagate.",
     "topic": "Wave Basics & Types",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q27",
     "type": "written",
     "prompt": "What term describes the maximum displacement of a wave's particles from their rest (equilibrium) position?",
     "answer": "Amplitude",
     "accept": [],
     "explanation": "Amplitude measures how far particles move from equilibrium and is related to the energy the wave carries.",
     "topic": "Wave Properties",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q28",
     "type": "written",
     "prompt": "A wave has a frequency of 17 Hz and travels at a speed of 340 m/s. Calculate its wavelength.",
     "answer": "20 m",
     "accept": [
      "20",
      "20m",
      "20 meters",
      "20 metres",
      "20 meter",
      "20 metre"
     ],
     "explanation": "Rearranging v = fλ gives λ = v/f = 340 m/s ÷ 17 Hz = 20 m.",
     "topic": "Wave Properties",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q29",
     "type": "written",
     "prompt": "A wave completes 3 full cycles in 0.6 seconds. What is its period?",
     "answer": "0.2 s",
     "accept": [
      "0.2",
      "0.2s",
      "0.2 seconds",
      ".2 s",
      ".2"
     ],
     "explanation": "Period is the time per cycle: T = total time ÷ number of cycles = 0.6 s ÷ 3 = 0.2 s.",
     "topic": "Wave Properties",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q30",
     "type": "written",
     "prompt": "What is the term for a wave bouncing back off a surface into its original medium?",
     "answer": "Reflection",
     "accept": [],
     "explanation": "Reflection occurs whenever a wave meets a boundary it cannot fully pass through and bounces back, as with an echo.",
     "topic": "Wave Behaviors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u7-q31",
     "type": "written",
     "prompt": "What term describes the fixed points of zero displacement on a standing wave?",
     "answer": "Nodes",
     "accept": [
      "node"
     ],
     "explanation": "Nodes are points on a standing wave that never move because of destructive interference between the two combining waves.",
     "topic": "Interference & Standing Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q32",
     "type": "written",
     "prompt": "Sound travels through air at about 340 m/s. If a sound wave has a wavelength of 1.7 m, what is its frequency?",
     "answer": "200 Hz",
     "accept": [
      "200",
      "200 hertz"
     ],
     "explanation": "Using f = v/λ: f = 340 m/s ÷ 1.7 m = 200 Hz.",
     "topic": "Sound Waves",
     "difficulty": "medium"
    },
    {
     "id": "phys-u7-q33",
     "type": "written",
     "prompt": "What is the term for a large increase in vibration amplitude that occurs when a system is driven at its natural frequency?",
     "answer": "Resonance",
     "accept": [],
     "explanation": "Resonance happens when the driving frequency matches a system's natural frequency, causing energy to build up and amplitude to grow significantly.",
     "topic": "Doppler Effect & Resonance",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "phys-u8",
   "unit": 8,
   "title": "Light and Optics",
   "summary": "Discover how light travels, bounces off mirrors, and bends through lenses and prisms, from the electromagnetic spectrum down to rainbows. Learn to apply the law of reflection, Snell's law, and lens rules to predict whether an image is real or virtual, upright or inverted.",
   "topics": [
    "Electromagnetic Spectrum & Wave Speed",
    "Reflection & Mirrors",
    "Refraction & Snell's Law",
    "Total Internal Reflection",
    "Lenses & Images",
    "Dispersion & Color"
   ],
   "terms": [
    {
     "term": "Electromagnetic spectrum",
     "definition": "The complete range of light-like radiation ordered by wavelength or frequency, from radio waves to gamma rays",
     "topic": "Electromagnetic Spectrum & Wave Speed"
    },
    {
     "term": "Speed of light (c)",
     "definition": "How fast all electromagnetic waves travel in a vacuum: about 3.00 x 10^8 m/s",
     "topic": "Electromagnetic Spectrum & Wave Speed"
    },
    {
     "term": "Wavelength",
     "definition": "The distance between two consecutive identical points on a wave, such as from one crest to the next",
     "topic": "Electromagnetic Spectrum & Wave Speed"
    },
    {
     "term": "Frequency",
     "definition": "The number of complete wave cycles passing a fixed point each second, measured in hertz",
     "topic": "Electromagnetic Spectrum & Wave Speed"
    },
    {
     "term": "Wave speed equation for light",
     "definition": "c = fλ, the relationship stating that the speed of light equals frequency multiplied by wavelength",
     "topic": "Electromagnetic Spectrum & Wave Speed"
    },
    {
     "term": "Law of reflection",
     "definition": "The rule stating that the angle of incidence equals the angle of reflection, both measured from the normal",
     "topic": "Reflection & Mirrors"
    },
    {
     "term": "Normal",
     "definition": "An imaginary line drawn perpendicular to a surface at the point where a light ray strikes it",
     "topic": "Reflection & Mirrors"
    },
    {
     "term": "Plane mirror",
     "definition": "A flat reflective surface that forms an upright, same-size virtual image directly behind itself",
     "topic": "Reflection & Mirrors"
    },
    {
     "term": "Concave mirror",
     "definition": "A mirror curved inward, like the inside of a bowl, that can converge reflected light rays",
     "topic": "Reflection & Mirrors"
    },
    {
     "term": "Convex mirror",
     "definition": "A mirror curved outward that spreads out reflected light rays, always forming a reduced virtual image",
     "topic": "Reflection & Mirrors"
    },
    {
     "term": "Refraction",
     "definition": "The bending of a light ray as it passes at an angle from one transparent medium into another",
     "topic": "Refraction & Snell's Law"
    },
    {
     "term": "Index of refraction equation",
     "definition": "n = c/v, the ratio of light's speed in a vacuum to its speed inside a given material",
     "topic": "Refraction & Snell's Law"
    },
    {
     "term": "Snell's law",
     "definition": "n1 sin(θ1) = n2 sin(θ2), relating the indices of refraction and angles on either side of a boundary",
     "topic": "Refraction & Snell's Law"
    },
    {
     "term": "Angle of incidence",
     "definition": "The angle between an incoming light ray and the normal at the point it meets a surface",
     "topic": "Refraction & Snell's Law"
    },
    {
     "term": "Angle of refraction",
     "definition": "The angle between a refracted light ray and the normal on the far side of a boundary",
     "topic": "Refraction & Snell's Law"
    },
    {
     "term": "Total internal reflection",
     "definition": "Light bouncing entirely back at a boundary with a lower-index medium when incidence exceeds the critical angle",
     "topic": "Total Internal Reflection"
    },
    {
     "term": "Critical angle",
     "definition": "Incidence angle in the higher-index medium that makes the refracted ray bend to 90° along the boundary",
     "topic": "Total Internal Reflection"
    },
    {
     "term": "Converging lens",
     "definition": "A lens, thicker at the center than the edges, that bends parallel light rays inward toward a focal point",
     "topic": "Lenses & Images"
    },
    {
     "term": "Diverging lens",
     "definition": "A lens, thinner at the center than the edges, that spreads parallel light rays outward",
     "topic": "Lenses & Images"
    },
    {
     "term": "Real image",
     "definition": "An image formed where light rays actually converge and meet, which can be projected onto a screen",
     "topic": "Lenses & Images"
    },
    {
     "term": "Virtual image",
     "definition": "An image formed where light rays only appear to diverge from, which cannot be projected onto a screen",
     "topic": "Lenses & Images"
    },
    {
     "term": "Focal point",
     "definition": "The point where parallel light rays converge, or appear to diverge from, after reflecting or refracting",
     "topic": "Lenses & Images"
    },
    {
     "term": "Focal length",
     "definition": "Distance from the center of a lens or mirror to where parallel rays converge or appear to diverge",
     "topic": "Lenses & Images"
    },
    {
     "term": "Dispersion",
     "definition": "The separation of white light into its component colors because different wavelengths refract by different amounts",
     "topic": "Dispersion & Color"
    },
    {
     "term": "Prism",
     "definition": "A transparent, angled optical device used to disperse white light into a visible spectrum of colors",
     "topic": "Dispersion & Color"
    },
    {
     "term": "Transparent material",
     "definition": "A material that allows light to pass through it with little scattering, so objects can be seen clearly through it",
     "topic": "Dispersion & Color"
    }
   ],
   "questions": [
    {
     "id": "phys-u8-q1",
     "type": "mc",
     "prompt": "Which list correctly orders regions of the electromagnetic spectrum from LONGEST wavelength to SHORTEST wavelength?",
     "options": [
      "Radio, microwave, infrared, visible, ultraviolet, X-ray, gamma ray",
      "Gamma ray, X-ray, ultraviolet, visible, infrared, microwave, radio",
      "Radio, infrared, microwave, visible, ultraviolet, gamma ray, X-ray",
      "Visible, infrared, radio, microwave, ultraviolet, X-ray, gamma ray"
     ],
     "answer": "Radio, microwave, infrared, visible, ultraviolet, X-ray, gamma ray",
     "explanation": "The EM spectrum runs from long, low-energy radio waves through microwave, infrared, visible, ultraviolet, X-ray, up to short, high-energy gamma rays.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q2",
     "type": "mc",
     "prompt": "A light wave has a frequency of 5.00 x 10^14 Hz. Using c = 3.00 x 10^8 m/s, what is its wavelength?",
     "options": [
      "6.00 x 10^-7 m",
      "6.00 x 10^-6 m",
      "1.67 x 10^6 m",
      "6.00 x 10^7 m"
     ],
     "answer": "6.00 x 10^-7 m",
     "explanation": "λ = c/f = (3.00 x 10^8)/(5.00 x 10^14) = 0.600 x 10^-6 = 6.00 x 10^-7 m, which is in the visible light range.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q3",
     "type": "mc",
     "prompt": "According to the law of reflection, when light reflects off a flat surface, the angle of incidence equals...",
     "options": [
      "the angle of reflection",
      "the angle of refraction",
      "twice the angle of reflection",
      "the critical angle"
     ],
     "answer": "the angle of reflection",
     "explanation": "The law of reflection states the angle of incidence equals the angle of reflection, both measured from the normal to the surface.",
     "topic": "Reflection & Mirrors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q4",
     "type": "mc",
     "prompt": "Which type of mirror always produces a virtual, upright, reduced image regardless of the object's distance from it?",
     "options": [
      "Convex mirror",
      "Concave mirror",
      "Plane mirror",
      "Converging lens"
     ],
     "answer": "Convex mirror",
     "explanation": "A convex mirror curves outward and always diverges reflected rays, giving a smaller, upright, virtual image no matter where the object is placed.",
     "topic": "Reflection & Mirrors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q5",
     "type": "mc",
     "prompt": "The image formed by a plane (flat) mirror is best described as...",
     "options": [
      "virtual, upright, and the same size as the object",
      "real, inverted, and the same size as the object",
      "virtual, inverted, and magnified",
      "real, upright, and reduced"
     ],
     "answer": "virtual, upright, and the same size as the object",
     "explanation": "A plane mirror reflects diverging rays that only appear to meet behind the mirror, producing a same-size, upright, virtual image.",
     "topic": "Reflection & Mirrors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q6",
     "type": "mc",
     "prompt": "A makeup or shaving mirror is a concave mirror held close to the face, closer than its focal point. What kind of image does it form?",
     "options": [
      "A magnified, upright, virtual image",
      "A reduced, inverted, real image",
      "A magnified, inverted, real image",
      "A same-size, virtual image"
     ],
     "answer": "A magnified, upright, virtual image",
     "explanation": "When an object is placed inside the focal point of a concave mirror, the reflected rays diverge, forming an enlarged, upright, virtual image behind the mirror.",
     "topic": "Reflection & Mirrors",
     "difficulty": "hard"
    },
    {
     "id": "phys-u8-q7",
     "type": "mc",
     "prompt": "Refraction of light happens because light...",
     "options": [
      "changes speed when it passes into a new medium",
      "changes color when it passes into a new medium",
      "loses energy every time it reflects",
      "travels faster in denser media than in less dense media"
     ],
     "answer": "changes speed when it passes into a new medium",
     "explanation": "Light bends at a boundary because its speed changes in the new medium; the change in speed, not color or energy loss, causes the bending.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q8",
     "type": "mc",
     "prompt": "Water has an index of refraction of n = 1.33. Using c = 3.00 x 10^8 m/s, what is the speed of light in water?",
     "options": [
      "2.26 x 10^8 m/s",
      "3.99 x 10^8 m/s",
      "1.33 x 10^8 m/s",
      "4.33 x 10^8 m/s"
     ],
     "answer": "2.26 x 10^8 m/s",
     "explanation": "Since n = c/v, v = c/n = (3.00 x 10^8)/1.33 ≈ 2.26 x 10^8 m/s.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q9",
     "type": "mc",
     "prompt": "Light traveling in air (n = 1.00) strikes a piece of glass (n = 1.50) at a 30° angle of incidence. What happens to the ray as it enters the glass?",
     "options": [
      "It bends toward the normal, because glass has a higher index of refraction",
      "It bends away from the normal, because glass has a higher index of refraction",
      "It bends toward the normal, because glass has a lower index of refraction",
      "It continues straight because the angle is small"
     ],
     "answer": "It bends toward the normal, because glass has a higher index of refraction",
     "explanation": "By Snell's law, light bends toward the normal when entering a medium with a higher index of refraction (slower speed), which is the case going from air into glass.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "hard"
    },
    {
     "id": "phys-u8-q10",
     "type": "mc",
     "prompt": "Which equation correctly states Snell's law for light crossing a boundary between two media?",
     "options": [
      "n1 sin(θ1) = n2 sin(θ2)",
      "n1 cos(θ1) = n2 cos(θ2)",
      "n1/θ1 = n2/θ2",
      "n1 θ1 = n2 θ2"
     ],
     "answer": "n1 sin(θ1) = n2 sin(θ2)",
     "explanation": "Snell's law relates the indices of refraction and the sines of the angles of incidence and refraction: n1 sin(θ1) = n2 sin(θ2).",
     "topic": "Refraction & Snell's Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q11",
     "type": "mc",
     "prompt": "Total internal reflection can occur only when light travels...",
     "options": [
      "from a denser (higher-index) medium to a less dense medium, at an angle greater than the critical angle",
      "from a less dense medium to a denser medium, at any angle",
      "from a denser medium to a less dense medium, at an angle less than the critical angle",
      "from a vacuum directly into glass"
     ],
     "answer": "from a denser (higher-index) medium to a less dense medium, at an angle greater than the critical angle",
     "explanation": "Total internal reflection requires light moving into an optically less dense medium and striking the boundary at an angle beyond the critical angle, so no light refracts out.",
     "topic": "Total Internal Reflection",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q12",
     "type": "mc",
     "prompt": "Diamond has a critical angle of about 24°, while ordinary glass has a critical angle of about 42°. Why does this make diamonds sparkle more than glass?",
     "options": [
      "Diamond's smaller critical angle causes more light inside it to undergo total internal reflection before escaping",
      "Diamond's larger critical angle traps less light inside it",
      "Diamond has a lower index of refraction than glass",
      "Diamond absorbs more light than glass, making it appear brighter"
     ],
     "answer": "Diamond's smaller critical angle causes more light inside it to undergo total internal reflection before escaping",
     "explanation": "A smaller critical angle means a wider range of incoming angles exceed it, so more light bounces around inside the diamond via total internal reflection before exiting, producing more sparkle.",
     "topic": "Total Internal Reflection",
     "difficulty": "hard"
    },
    {
     "id": "phys-u8-q13",
     "type": "mc",
     "prompt": "A lens that is thicker at its center than at its edges is called a converging lens, also known as a...",
     "options": [
      "convex lens",
      "concave lens",
      "diverging lens",
      "plane lens"
     ],
     "answer": "convex lens",
     "explanation": "Converging lenses bulge outward in the middle, which is why they are also called convex lenses; they bend parallel rays inward toward a focal point.",
     "topic": "Lenses & Images",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q14",
     "type": "mc",
     "prompt": "For a real object, a diverging lens always produces what type of image?",
     "options": [
      "A virtual, upright, reduced image",
      "A real, inverted, magnified image",
      "A real, upright, same-size image",
      "A virtual, inverted, magnified image"
     ],
     "answer": "A virtual, upright, reduced image",
     "explanation": "A diverging lens spreads light rays apart, so they never actually converge; the eye traces them back to form a smaller, upright, virtual image on the same side as the object.",
     "topic": "Lenses & Images",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q15",
     "type": "mc",
     "prompt": "In a camera, an object is placed well beyond the focal point of a converging lens. What kind of image forms on the camera's sensor?",
     "options": [
      "A real, inverted image",
      "A virtual, upright image",
      "A real, upright image",
      "No image forms"
     ],
     "answer": "A real, inverted image",
     "explanation": "When an object is beyond the focal point of a converging lens, refracted rays actually cross and converge, forming a real, inverted image that can be projected onto a sensor or screen.",
     "topic": "Lenses & Images",
     "difficulty": "hard"
    },
    {
     "id": "phys-u8-q16",
     "type": "mc",
     "prompt": "When white light passes through a prism, it separates into a spectrum of colors mainly because...",
     "options": [
      "different wavelengths of light refract by slightly different amounts",
      "different wavelengths of light reflect off the prism's surface at different angles",
      "different wavelengths of light travel at different speeds in a vacuum",
      "different wavelengths of light have different amplitudes"
     ],
     "answer": "different wavelengths of light refract by slightly different amounts",
     "explanation": "The prism's index of refraction varies slightly with wavelength, so violet light bends more than red light, spreading white light into its component colors (dispersion).",
     "topic": "Dispersion & Color",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q17",
     "type": "tf",
     "prompt": "Visible light has a longer wavelength than X-rays.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Visible light wavelengths (about 400-700 nm) are much longer than X-ray wavelengths (about 0.01-10 nm) on the electromagnetic spectrum.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q18",
     "type": "tf",
     "prompt": "All types of electromagnetic waves travel at the same speed in a vacuum.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Radio waves, visible light, gamma rays, and every other EM wave all travel at c = 3.00 x 10^8 m/s in a vacuum, regardless of frequency or wavelength.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q19",
     "type": "tf",
     "prompt": "In the law of reflection, the angle of incidence is measured from the surface of the mirror, not from the normal.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Both the angle of incidence and the angle of reflection are measured from the normal, the line perpendicular to the surface, not from the surface itself.",
     "topic": "Reflection & Mirrors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q20",
     "type": "tf",
     "prompt": "A concave mirror can produce a real image.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "When an object is placed beyond the focal point of a concave mirror, reflected rays actually converge in front of the mirror, forming a real image.",
     "topic": "Reflection & Mirrors",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q21",
     "type": "tf",
     "prompt": "Light bends away from the normal when it enters a medium with a higher index of refraction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Light bends toward the normal when entering a medium with a higher index of refraction, since it slows down there.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q22",
     "type": "tf",
     "prompt": "Total internal reflection requires light to travel from a medium with a lower index of refraction into a medium with a higher index of refraction.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Total internal reflection happens in the opposite case: light must travel from a higher-index (denser) medium into a lower-index (less dense) medium at an angle beyond the critical angle.",
     "topic": "Total Internal Reflection",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q23",
     "type": "tf",
     "prompt": "A real image can be projected onto a screen.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Real images form where light rays actually converge, so placing a screen at that location will display the image; virtual images cannot be projected this way.",
     "topic": "Lenses & Images",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q24",
     "type": "tf",
     "prompt": "Red light bends more than violet light when passing through a prism.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Violet light has a shorter wavelength and refracts more than red light in a prism, so violet is deviated the most and red the least (with the prism point-up, violet ends up at the bottom of the spectrum and red at the top).",
     "topic": "Dispersion & Color",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q25",
     "type": "written",
     "prompt": "What is the approximate speed of light in a vacuum, in meters per second? Round to 3 significant figures and use scientific notation.",
     "answer": "3.00 x 10^8 m/s",
     "accept": [
      "3 x 10^8 m/s",
      "3.0 x 10^8 m/s",
      "3.00x10^8",
      "3x10^8 m/s",
      "300000000 m/s",
      "300,000,000 m/s",
      "3.00 x 10^8 meters per second"
     ],
     "explanation": "The speed of light in a vacuum is a fundamental constant, c ≈ 3.00 x 10^8 m/s.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q26",
     "type": "written",
     "prompt": "A radio wave has a wavelength of 2.0 m. Using c = 3.00 x 10^8 m/s, find its frequency. Round to 2 significant figures.",
     "answer": "1.5 x 10^8 Hz",
     "accept": [
      "1.5x10^8 Hz",
      "1.5 x 10^8",
      "150000000 Hz",
      "150,000,000 Hz",
      "150000000",
      "1.50 x 10^8 Hz",
      "1.5 x 10^8 hertz",
      "150 MHz",
      "150 megahertz"
     ],
     "explanation": "f = c/λ = (3.00 x 10^8)/2.0 = 1.5 x 10^8 Hz.",
     "topic": "Electromagnetic Spectrum & Wave Speed",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q27",
     "type": "written",
     "prompt": "What is the name of the imaginary line, drawn perpendicular to a surface at the point light strikes it, used to measure angles of incidence and reflection?",
     "answer": "normal",
     "accept": [
      "the normal",
      "normal line",
      "the normal line"
     ],
     "explanation": "The normal is the reference line perpendicular to a surface from which all angles of incidence, reflection, and refraction are measured.",
     "topic": "Reflection & Mirrors",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q28",
     "type": "written",
     "prompt": "What is the name of the ratio of the speed of light in a vacuum to its speed in a given material?",
     "answer": "index of refraction",
     "accept": [
      "refractive index",
      "the index of refraction",
      "the refractive index",
      "n"
     ],
     "explanation": "This ratio, n = c/v, is called the index of refraction and describes how much a material slows down and bends light.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q29",
     "type": "written",
     "prompt": "A type of glass has an index of refraction of n = 1.5. Using c = 3.00 x 10^8 m/s, find the speed of light in this glass.",
     "answer": "2.0 x 10^8 m/s",
     "accept": [
      "2 x 10^8 m/s",
      "2.0x10^8 m/s",
      "200000000 m/s",
      "200,000,000 m/s",
      "2.00 x 10^8 m/s",
      "2.0 x 10^8",
      "2 x 10^8",
      "200000000",
      "2.0 x 10^8 meters per second",
      "2 x 10^8 meters per second"
     ],
     "explanation": "v = c/n = (3.00 x 10^8)/1.5 = 2.0 x 10^8 m/s.",
     "topic": "Refraction & Snell's Law",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q30",
     "type": "written",
     "prompt": "What is the name of the minimum angle of incidence, in a denser medium, beyond which light is completely reflected instead of refracting out into a less dense medium?",
     "answer": "critical angle",
     "accept": [
      "the critical angle"
     ],
     "explanation": "Beyond the critical angle, all light reflects back into the denser medium instead of refracting out, a condition called total internal reflection.",
     "topic": "Total Internal Reflection",
     "difficulty": "medium"
    },
    {
     "id": "phys-u8-q31",
     "type": "written",
     "prompt": "What type of lens is thinner at its center than at its edges?",
     "answer": "diverging lens",
     "accept": [
      "concave lens",
      "a diverging lens",
      "a concave lens",
      "diverging",
      "concave"
     ],
     "explanation": "A lens that is thinner in the middle spreads light rays apart and is called a diverging, or concave, lens.",
     "topic": "Lenses & Images",
     "difficulty": "easy"
    },
    {
     "id": "phys-u8-q32",
     "type": "written",
     "prompt": "What is the term for the separation of white light into its component colors, as seen with a prism or a rainbow?",
     "answer": "dispersion",
     "accept": [
      "light dispersion",
      "the dispersion of light"
     ],
     "explanation": "Dispersion occurs because different wavelengths of light refract by slightly different amounts, spreading white light into a spectrum of colors.",
     "topic": "Dispersion & Color",
     "difficulty": "easy"
    }
   ]
  },
  {
   "id": "phys-u9",
   "unit": 9,
   "title": "Electricity and Magnetism",
   "summary": "Discover how charges, currents, and magnets interact — from Coulomb's law and Ohm's law to series and parallel circuits, electric power, and the electromagnetic induction that powers motors and generators. Practice both the concepts and the core calculations you'll need for circuit problems.",
   "topics": [
    "Charge & Static Electricity",
    "Coulomb's Law & Electric Fields",
    "Current, Voltage & Resistance",
    "Series & Parallel Circuits",
    "Electric Power",
    "Magnetism & Electromagnets",
    "Induction, Motors & Generators"
   ],
   "terms": [
    {
     "term": "Electric charge",
     "definition": "A property of matter, positive or negative, that produces electric forces between particles; measured in coulombs.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Conductor",
     "definition": "A material, such as most metals, through which electric charge moves freely.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Insulator",
     "definition": "A material, such as rubber or glass, through which electric charge does not move freely.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Charging by friction",
     "definition": "Rubbing two objects together so electrons transfer, leaving one object positive and the other negative.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Charging by conduction",
     "definition": "Giving a neutral object charge by touching it directly with a charged object.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Charging by induction",
     "definition": "Charging an object without contact: a nearby charged object separates its charges, and a brief ground connection lets electrons flow on or off, leaving it with the opposite charge.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Law of conservation of charge",
     "definition": "Total charge in an isolated system stays constant; charge is only transferred, never created or destroyed.",
     "topic": "Charge & Static Electricity"
    },
    {
     "term": "Coulomb's law",
     "definition": "F = kq₁q₂/r²; gives the electric force between two point charges based on their charges and separation.",
     "topic": "Coulomb's Law & Electric Fields"
    },
    {
     "term": "Electric field",
     "definition": "The region around a charged object where another charge would experience a force.",
     "topic": "Coulomb's Law & Electric Fields"
    },
    {
     "term": "Elementary charge",
     "definition": "The smallest possible unit of charge, about 1.6 x 10^-19 C, carried by one proton or electron.",
     "topic": "Coulomb's Law & Electric Fields"
    },
    {
     "term": "Electric current",
     "definition": "The rate at which charge flows past a point in a circuit; measured in amperes.",
     "topic": "Current, Voltage & Resistance"
    },
    {
     "term": "Voltage",
     "definition": "The difference in electric potential that pushes current through a circuit; measured in volts.",
     "topic": "Current, Voltage & Resistance"
    },
    {
     "term": "Resistance",
     "definition": "A material's opposition to the flow of current; measured in ohms.",
     "topic": "Current, Voltage & Resistance"
    },
    {
     "term": "Ohm's law",
     "definition": "V = IR; relates voltage, current, and resistance in a circuit.",
     "topic": "Current, Voltage & Resistance"
    },
    {
     "term": "Series circuit",
     "definition": "A circuit with only one path, so the same current flows through every component.",
     "topic": "Series & Parallel Circuits"
    },
    {
     "term": "Parallel circuit",
     "definition": "A circuit with multiple branches, so the voltage is the same across each branch.",
     "topic": "Series & Parallel Circuits"
    },
    {
     "term": "Equivalent resistance (series)",
     "definition": "Req = R1 + R2 + ...; found by adding resistances along a single current path.",
     "topic": "Series & Parallel Circuits"
    },
    {
     "term": "Equivalent resistance (parallel)",
     "definition": "1/Req = 1/R1 + 1/R2 + ...; the result is always smaller than the smallest branch resistance.",
     "topic": "Series & Parallel Circuits"
    },
    {
     "term": "Electric power",
     "definition": "The rate at which a circuit transfers energy; P = IV, measured in watts.",
     "topic": "Electric Power"
    },
    {
     "term": "Magnetic field",
     "definition": "The region around a magnet or current-carrying wire where a magnetic force can be felt.",
     "topic": "Magnetism & Electromagnets"
    },
    {
     "term": "Electromagnet",
     "definition": "A magnet created by running current through a coil of wire, usually wrapped around an iron core.",
     "topic": "Magnetism & Electromagnets"
    },
    {
     "term": "Electromagnetic induction",
     "definition": "Producing a voltage and current in a wire by changing the magnetic field passing through it.",
     "topic": "Induction, Motors & Generators"
    },
    {
     "term": "Electric motor",
     "definition": "A device that uses magnetic forces on a current to convert electrical energy into mechanical motion.",
     "topic": "Induction, Motors & Generators"
    },
    {
     "term": "Generator",
     "definition": "A device that converts mechanical motion into electrical energy through electromagnetic induction.",
     "topic": "Induction, Motors & Generators"
    }
   ],
   "questions": [
    {
     "id": "phys-u9-q1",
     "type": "mc",
     "prompt": "A student rubs a balloon on their hair. The balloon ends up negatively charged. What happened to the hair?",
     "options": [
      "The hair lost electrons and became positively charged",
      "The hair gained electrons and became positively charged",
      "The hair lost protons and became negatively charged",
      "The hair stayed neutral because no charge was transferred"
     ],
     "answer": "The hair lost electrons and became positively charged",
     "explanation": "In charging by friction, electrons transfer from one object to the other. Since the balloon gained electrons (became negative), the hair lost electrons and is left positively charged.",
     "topic": "Charge & Static Electricity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q2",
     "type": "mc",
     "prompt": "Which of these materials is the best example of a conductor?",
     "options": [
      "Copper wire",
      "Rubber glove",
      "Glass rod",
      "Plastic ruler"
     ],
     "answer": "Copper wire",
     "explanation": "Metals like copper have electrons that move freely, making them good conductors, while rubber, glass, and plastic are insulators.",
     "topic": "Charge & Static Electricity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q3",
     "type": "mc",
     "prompt": "A charged rod is held near a neutral metal sphere without touching it. While the rod is nearby, the sphere is briefly grounded; then the ground is disconnected and the rod removed, leaving the sphere charged. This process is called:",
     "options": [
      "Charging by friction",
      "Charging by conduction",
      "Charging by induction",
      "Static discharge"
     ],
     "answer": "Charging by induction",
     "explanation": "In induction the charged rod never touches the sphere. It separates the sphere's charges. While the sphere is grounded, electrons flow between the sphere and the ground: away from a negative rod, or toward a positive one. So the sphere is left with a charge opposite to the rod's.",
     "topic": "Charge & Static Electricity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q4",
     "type": "mc",
     "prompt": "A negatively charged metal sphere touches a neutral metal sphere, and some of the excess electrons flow onto the neutral sphere. This way of charging an object is called:",
     "options": [
      "Charging by induction",
      "Charging by conduction",
      "Charging by friction",
      "Electric polarization"
     ],
     "answer": "Charging by conduction",
     "explanation": "Conduction transfers charge through direct contact, so both spheres end up with the same sign of charge (negative here); induction needs no contact and friction requires rubbing.",
     "topic": "Charge & Static Electricity",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q5",
     "type": "tf",
     "prompt": "Charging by friction works by transferring protons from one object to another.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Friction transfers electrons, not protons, because electrons are much easier to dislodge from atoms; protons stay fixed in the nucleus.",
     "topic": "Charge & Static Electricity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q6",
     "type": "tf",
     "prompt": "Insulators allow electric charge to flow through them easily.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "Insulators resist the flow of charge; it is conductors, like metals, that allow charge to move freely.",
     "topic": "Charge & Static Electricity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q7",
     "type": "written",
     "prompt": "What is the SI unit of electric charge?",
     "answer": "coulomb",
     "accept": [
      "coulombs",
      "C"
     ],
     "explanation": "Electric charge is measured in coulombs (C), named after physicist Charles-Augustin de Coulomb.",
     "topic": "Charge & Static Electricity",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q8",
     "type": "mc",
     "prompt": "Two point charges are a distance r apart and exert a force F on each other. If the distance is doubled while the charges stay the same, what happens to the force?",
     "options": [
      "It becomes half as strong",
      "It becomes twice as strong",
      "It becomes one-fourth as strong",
      "It becomes four times as strong"
     ],
     "answer": "It becomes one-fourth as strong",
     "explanation": "Coulomb's law force is proportional to 1/r^2. Doubling r means dividing by 2^2 = 4, so the new force is F/4, one-fourth as strong.",
     "topic": "Coulomb's Law & Electric Fields",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q9",
     "type": "mc",
     "prompt": "According to Coulomb's law, two charges with the same sign (both positive or both negative) will:",
     "options": [
      "Attract each other",
      "Repel each other",
      "Exert no force on each other",
      "Cancel each other out completely"
     ],
     "answer": "Repel each other",
     "explanation": "Like charges repel and opposite charges attract; this is a basic rule of electrostatics built into Coulomb's law.",
     "topic": "Coulomb's Law & Electric Fields",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q10",
     "type": "written",
     "prompt": "Two point charges attract each other with a force of 8 N at a certain distance. If the distance between them is tripled (charges unchanged), what is the new force? Round to two decimal places.",
     "answer": "0.89 N",
     "accept": [
      "0.89",
      "0.89 newtons"
     ],
     "explanation": "Force follows F ∝ 1/r^2, so tripling the distance divides the force by 3^2 = 9: 8 N / 9 ≈ 0.89 N.",
     "topic": "Coulomb's Law & Electric Fields",
     "difficulty": "hard"
    },
    {
     "id": "phys-u9-q11",
     "type": "mc",
     "prompt": "The electric field lines around an isolated positive point charge point:",
     "options": [
      "Toward the charge",
      "Away from the charge",
      "Parallel to the charge's surface",
      "In a circular loop around the charge"
     ],
     "answer": "Away from the charge",
     "explanation": "By convention, electric field lines point away from positive charges (the direction a positive test charge would be pushed) and toward negative charges.",
     "topic": "Coulomb's Law & Electric Fields",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q12",
     "type": "mc",
     "prompt": "Which unit is used to measure electric current?",
     "options": [
      "Volt",
      "Ohm",
      "Ampere",
      "Watt"
     ],
     "answer": "Ampere",
     "explanation": "Current, the flow rate of charge, is measured in amperes (A); volts measure voltage, ohms measure resistance, and watts measure power.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q13",
     "type": "mc",
     "prompt": "Which unit is used to measure electrical resistance?",
     "options": [
      "Ampere",
      "Ohm",
      "Volt",
      "Coulomb"
     ],
     "answer": "Ohm",
     "explanation": "Resistance is measured in ohms (Ω); amperes measure current, volts measure voltage, and coulombs measure charge.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q14",
     "type": "written",
     "prompt": "What is the SI unit of electric potential difference?",
     "answer": "volt",
     "accept": [
      "volts",
      "V"
     ],
     "explanation": "Voltage, or electric potential difference, is measured in volts (V), named after physicist Alessandro Volta.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q15",
     "type": "mc",
     "prompt": "A resistor has a resistance of 20 Ω and a voltage of 120 V across it. Using Ohm's law (V = IR), what is the current through it?",
     "options": [
      "6 A",
      "0.17 A",
      "100 A",
      "140 A"
     ],
     "answer": "6 A",
     "explanation": "Rearranging V = IR gives I = V/R = 120 V / 20 Ω = 6 A.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q16",
     "type": "written",
     "prompt": "A resistor carries a current of 3 A and has a resistance of 15 Ω. What is the voltage across it? (Use V = IR.)",
     "answer": "45 V",
     "accept": [
      "45",
      "45 volts"
     ],
     "explanation": "Using Ohm's law, V = IR = 3 A x 15 Ω = 45 V.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q17",
     "type": "tf",
     "prompt": "According to Ohm's law, if the resistance in a circuit increases while the voltage stays the same, the current must decrease.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Since I = V/R, increasing R while V stays fixed makes the current I smaller.",
     "topic": "Current, Voltage & Resistance",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q18",
     "type": "mc",
     "prompt": "In a series circuit containing several resistors, the current through each resistor is:",
     "options": [
      "Different at each resistor",
      "The same at every point in the circuit",
      "Zero at every resistor",
      "Determined only by the last resistor"
     ],
     "answer": "The same at every point in the circuit",
     "explanation": "A series circuit has only one path for charge to flow, so the same current passes through every component.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q19",
     "type": "mc",
     "prompt": "In a parallel circuit with several branches, the voltage across each branch is:",
     "options": [
      "Different for each branch",
      "The same across every branch",
      "Always zero",
      "Equal to the sum of all branch voltages"
     ],
     "answer": "The same across every branch",
     "explanation": "In a parallel circuit, every branch connects across the same two points, so each branch experiences the same voltage.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q20",
     "type": "written",
     "prompt": "A 4 Ω resistor and a 6 Ω resistor are connected in series. What is the equivalent resistance of the combination?",
     "answer": "10 ohms",
     "accept": [
      "10",
      "10 Ω",
      "10 Ohm"
     ],
     "explanation": "In series, resistances simply add: Req = R1 + R2 = 4 Ω + 6 Ω = 10 Ω.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q21",
     "type": "written",
     "prompt": "A 6 Ω resistor and a 3 Ω resistor are connected in parallel. What is the equivalent resistance of the combination?",
     "answer": "2 ohms",
     "accept": [
      "2",
      "2 Ω",
      "2.0",
      "2.0 ohms"
     ],
     "explanation": "For parallel resistors, 1/Req = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2, so Req = 2 Ω.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "hard"
    },
    {
     "id": "phys-u9-q22",
     "type": "mc",
     "prompt": "Three identical 12 Ω resistors are connected in parallel. What is the equivalent resistance of the combination?",
     "options": [
      "36 Ω",
      "4 Ω",
      "12 Ω",
      "3 Ω"
     ],
     "answer": "4 Ω",
     "explanation": "1/Req = 1/12 + 1/12 + 1/12 = 3/12 = 1/4, so Req = 4 Ω. In general, n identical resistors in parallel give R/n.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "hard"
    },
    {
     "id": "phys-u9-q23",
     "type": "tf",
     "prompt": "Adding more resistors in parallel always decreases the total equivalent resistance of the combination.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "Each new parallel branch gives current an additional path, so 1/Req grows and Req always shrinks below any single branch's resistance.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q24",
     "type": "tf",
     "prompt": "Adding more resistors in series always decreases the total equivalent resistance of the circuit.",
     "options": [
      "True",
      "False"
     ],
     "answer": "False",
     "explanation": "In series, resistances add together (Req = R1 + R2 + ...), so adding more resistors always increases the total resistance, not decreases it.",
     "topic": "Series & Parallel Circuits",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q25",
     "type": "mc",
     "prompt": "A device operates at 120 V and draws a current of 2 A. What is its power consumption? (Use P = IV.)",
     "options": [
      "60 W",
      "120 W",
      "240 W",
      "480 W"
     ],
     "answer": "240 W",
     "explanation": "Power equals current times voltage: P = IV = 2 A x 120 V = 240 W.",
     "topic": "Electric Power",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q26",
     "type": "written",
     "prompt": "A light bulb uses 60 W of power when plugged into a 120 V outlet. How much current does it draw? (Use P = IV.)",
     "answer": "0.5 A",
     "accept": [
      "0.5",
      "0.5 amps",
      "0.5 amperes"
     ],
     "explanation": "Rearranging P = IV gives I = P/V = 60 W / 120 V = 0.5 A.",
     "topic": "Electric Power",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q27",
     "type": "mc",
     "prompt": "What is the SI unit of electric power?",
     "options": [
      "Joule",
      "Watt",
      "Volt",
      "Ampere"
     ],
     "answer": "Watt",
     "explanation": "Power, the rate of energy transfer, is measured in watts (W); a joule measures energy, not the rate of its transfer.",
     "topic": "Electric Power",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q28",
     "type": "mc",
     "prompt": "Which statement correctly describes how magnetic poles interact?",
     "options": [
      "Like poles attract, unlike poles repel",
      "Like poles repel, unlike poles attract",
      "All poles attract each other regardless of type",
      "Magnetic poles never exert a force on each other"
     ],
     "answer": "Like poles repel, unlike poles attract",
     "explanation": "Just like electric charges, magnetic poles follow the rule that like poles (N-N or S-S) repel and unlike poles (N-S) attract.",
     "topic": "Magnetism & Electromagnets",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q30",
     "type": "mc",
     "prompt": "Which change would increase the strength of an electromagnet made from a coil of wire around an iron core?",
     "options": [
      "Decreasing the current through the coil",
      "Removing the iron core",
      "Increasing the number of turns in the coil",
      "Spacing the coil turns farther apart"
     ],
     "answer": "Increasing the number of turns in the coil",
     "explanation": "Electromagnet strength increases with more coil turns, higher current, and a ferromagnetic (iron) core, since each turn adds to the magnetic field.",
     "topic": "Magnetism & Electromagnets",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q31",
     "type": "written",
     "prompt": "What do we call a temporary magnet made by running electric current through a coil of wire, usually wrapped around an iron core?",
     "answer": "electromagnet",
     "accept": [
      "an electromagnet"
     ],
     "explanation": "This is called an electromagnet; its magnetism only exists while current flows through the coil.",
     "topic": "Magnetism & Electromagnets",
     "difficulty": "easy"
    },
    {
     "id": "phys-u9-q32",
     "type": "mc",
     "prompt": "Which action would induce a current in a coil of wire connected to a closed loop, according to electromagnetic induction?",
     "options": [
      "Holding a magnet perfectly still inside the coil",
      "Moving a magnet into or out of the coil",
      "Placing the coil far away from any magnet",
      "Wrapping the coil around a block of wood with no magnet nearby"
     ],
     "answer": "Moving a magnet into or out of the coil",
     "explanation": "Induction requires a changing magnetic field through the coil; moving a magnet in or out changes the field, while a stationary magnet does not.",
     "topic": "Induction, Motors & Generators",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q33",
     "type": "mc",
     "prompt": "What is the main functional difference between an electric motor and a generator?",
     "options": [
      "Motor: mechanical to electrical; generator: electrical to mechanical",
      "Motor: electrical to mechanical; generator: mechanical to electrical",
      "Motor: electrical to thermal; generator: thermal to electrical",
      "Motor: chemical to electrical; generator: electrical to chemical"
     ],
     "answer": "Motor: electrical to mechanical; generator: mechanical to electrical",
     "explanation": "A motor uses the force on a current in a magnetic field to produce motion, while a generator uses motion in a magnetic field to induce a current; these are opposite energy conversions.",
     "topic": "Induction, Motors & Generators",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q34",
     "type": "tf",
     "prompt": "Electromagnetic induction requires a changing magnetic field, such as from relative motion between a magnet and a coil, to produce a current.",
     "options": [
      "True",
      "False"
     ],
     "answer": "True",
     "explanation": "A steady, unchanging magnetic field induces no current; only a changing field (from motion or a changing current elsewhere) induces a voltage and current.",
     "topic": "Induction, Motors & Generators",
     "difficulty": "medium"
    },
    {
     "id": "phys-u9-q35",
     "type": "written",
     "prompt": "A circuit has a current of 5 A flowing through an 8 Ω resistor. What is the power dissipated? (Use P = I^2R.)",
     "answer": "200 W",
     "accept": [
      "200",
      "200 watts"
     ],
     "explanation": "Using P = I^2R = (5 A)^2 x 8 Ω = 25 x 8 = 200 W.",
     "topic": "Electric Power",
     "difficulty": "hard"
    }
   ]
  }
 ]
});
