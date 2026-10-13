'use strict';
// Original, local lessons. Reference code is revealed only through the hint ladder.
(function(root){
 const units=[
  {id:'talk',label:'Unit 1',title:'Make Python Talk',icon:'💬',badge:'Message Maker'},
  {id:'store',label:'Unit 2',title:'Store Information',icon:'📦',badge:'Profile Builder'},
  {id:'math',label:'Unit 3',title:'Do Math',icon:'🧮',badge:'Math Explorer'},
  {id:'robot',label:'Project 1',title:'Robot Interview',icon:'🤖',badge:'Conversation Creator',project:true},
  {id:'decisions',label:'Unit 4',title:'Make Decisions',icon:'🛤️',badge:'Decision Detective'},
  {id:'loops',label:'Unit 5',title:'Repeat with Loops',icon:'🔁',badge:'Loop Explorer'},
  {id:'guess',label:'Project 2',title:'Guess the Number',icon:'🎯',badge:'Game Builder',project:true}
 ];
 const steps=[];
 function add(unitId,title,mission,concept,starterCode,referenceCode,expectedSkills,successChecklist,rule,options={}){
  const number=steps.filter(step=>step.unitId===unitId).length+1;
  steps.push({id:unitId+'-'+number,unitId,title,mission,concept,starterCode,referenceCode,expectedSkills,successChecklist,rule,
   mode:options.challenge?'Build It':options.mode||'Modify Code',challenge:!!options.challenge,
   hints:[options.hint1||('Think about '+expectedSkills[0]+'. Look at the small example in the lesson.'),options.hint2||('Work on '+successChecklist[0].toLowerCase()+'. Change one line, then run it.'),referenceCode],
   completionMessage:options.completionMessage||'You typed, tested, and built something new!',bonus:options.bonus||[],inputs:options.inputs||[],...options});
 }
 add('talk','Run Your First Print','Run this line. Read what Python says.','print() puts a message in the output. Text goes between quotation marks.',
  'print("Hello, world!")','print("Hello, world!")',['print()','text in quotes'],['Run Code before Check','See Hello, world! in Output'],'first-print',{mode:'Guided Typing',hint2:'Click Run Code. Then look for Hello, world! in Output.'});
 add('talk','Change the Message','Change Hello to your name or nickname.','Keep the quotes and parentheses. Only change the text inside them.',
  'print("Hello!")','print("Sky!")',['print()','quotation marks'],['Print your own message','Change the starter message'],'message');
 add('talk','Fix the Quotes','This message is missing a quotation mark. Repair it.','Text needs a quotation mark at each end. A closing parenthesis comes after the text.',
  'print("I love coding!)','print("I love coding!")',['paired quotes','parentheses'],['Close the text with a quotation mark','Run without an error'],'quotes',{mode:'Guided Typing',hint2:'Look just before the last ). The text needs a closing ".'});
 add('talk','Make Three Messages','Tell us your nickname, a color you like, and that you are learning Python.','Each print() starts a new output line. You can write one print() below another.',
  '# Write three print() lines below.\nprint("My name is ...")\n','print("My name is Sky")\nprint("My favorite color is blue")\nprint("I am learning Python!")',['three print() calls'],['Write at least three print() calls','Include I am learning Python!'],'three-print',{mode:'Complete Code'});
 add('talk','My Python Poster','Build a three-line poster about you. Use a nickname, a favorite thing, and a positive message.','You are the designer. Friendly text can make a tiny program feel like yours.',
  '# My Python Poster\n','print("Name: Sky")\nprint("I love space")\nprint("I can learn new things!")',['print()','your own text'],['Print a name or nickname','Print a favorite thing','Print a positive message on a third line'],'poster',{challenge:true,bonus:['Add an emoji or ASCII art','Print at least five lines']});
 add('store','Name Variable','Store your nickname in name. Print the variable.','A variable is a labeled box. name = "Sky" stores text. print(name) opens the box.',
  'name = "Alex"\nprint(name)','name = "Sky"\nprint(name)',['string variable','print a variable'],['Change Alex to your nickname','Print name without quotes around the variable'],'name');
 add('store','Number Variable','Choose a whole-number age for a character. Keep it as a number.','An integer is a whole number. age = 10 is a number. age = "10" is text.',
  'age = 10\nprint(age)','age = 12\nprint(age)',['integer variable'],['Store a whole number in age','Print that number'],'age');
 add('store','Text vs Number','Fix score so Python adds 10 and 5.','Quotation marks make text. Numbers without quotes can be added with +.',
  'score = "10"\nprint(score + 5)','score = 10\nprint(score + 5)',['numbers','addition'],['Keep score as a number','Print 15'],'score');
 add('store','True or False','Choose whether your character likes pizza.','A boolean is True or False. These two Python words start with capital letters. No quotes!',
  'likes_pizza = True\nprint(likes_pizza)','likes_pizza = False\nprint(likes_pizza)',['boolean variable'],['Store True or False in likes_pizza','Print the boolean'],'boolean');
 add('store','Player Profile Card','Build a profile for you or an invented player.','Use labeled boxes for different kinds of information. A float, such as 1.4, has a decimal point.',
  '# Create your player variables.\nname = ""\n','name = "Sky"\nage = 12\nfavorite_food = "noodles"\nlikes_games = True\nheight = 1.4\nprint("Name:", name)\nprint("Age:", age)\nprint("Food:", favorite_food)\nprint("Games:", likes_games)',['strings','integers','booleans'],['Store a name, age, favorite food, and game preference','Use text, a number, and a boolean','Print at least three pieces of information'],'profile',{challenge:true,bonus:['Add a float, such as height = 1.4','Use labels in your output']});
 add('math','Add and Multiply','Print 7 + 3 and 4 * 3. Add a subtraction line too.','+ adds, - subtracts, and * multiplies. Python can do math inside print().',
  'print(7 + 3)\n# Add multiplication and subtraction below.','print(7 + 3)\nprint(4 * 3)\nprint(9 - 2)',['+','*','-'],['Use addition, multiplication, and subtraction','Show 10 and 12 in Output'],'arithmetic',{mode:'Complete Code'});
 add('math','Divide Numbers','Share 9 equally between 2. Print the result.','/ divides and can give a decimal answer. // gives the whole-number part.',
  'print(9 / 3)','print(9 / 2)',['division /'],['Use / to divide','Print 4.5'],'divide');
 add('math','Find a Remainder','Find what is left when 17 is shared in groups of 5.','% gives the remainder. 10 % 3 is 1 because one is left over.',
  'print(17 % 4)','print(17 % 5)',['remainder %'],['Use %','Print 2'],'remainder');
 add('math','Use Math Variables','Change the numbers so your points minus cost leaves 12.','Math can use variables. Python reads their values before it calculates.',
  'points = 20\ncost = 5\nprint(points - cost)','points = 20\ncost = 8\nprint(points - cost)',['numeric variables','subtraction'],['Use two numeric variables','Subtract them and print 12'],'math-vars');
 add('math','Snack Splitter','Share snacks fairly. Show the share and what is left.','Choose at least two friends. Use / or // for a share, then % for leftovers.',
  'total_snacks = 17\nfriends = 5\n# Calculate and print each share and the leftovers.','total_snacks = 17\nfriends = 5\nshare = total_snacks // friends\nleft = total_snacks % friends\nprint("Each friend:", share)\nprint("Left over:", left)',['numeric variables','division','remainder'],['Store snack and friend numbers','Calculate a share with / or //','Calculate leftovers with %','Print both results with labels'],'snacks',{challenge:true,bonus:['Explain what happens with one extra friend'],comingSoon:'Input version · Coming Soon'});
 add('robot','Robot Interview','Build a friendly robot that asks questions and talks back.','input() asks a question and returns the reply as text. Test Inputs supplies replies in order. print("Hi", name) prints text and a variable together.',
  '# Robot Interview\nname = input("What is your name? ")\n\n# Ask about a favorite animal below.\n',
  'name = input("What is your name? ")\nanimal = input("What is your favorite animal? ")\nprint("Hello", name)\nprint("I like", animal, "too!")',['variables','print()','input()'],['Ask for a name with input()','Ask for a favorite animal with input()','Print replies using both answers','Run without an error'],'robot',{
   mode:'Build It',project:true,inputs:['Sky','otter'],testCases:[{inputs:['Nova','fox'],contains:['nova','fox']}],bonus:['Ask a third question','Use three variables','Add an emoji or a funny ending'],
   buildSteps:['Ask about an animal','Greet your player','Talk about the animal','Run and Check Project'],
   projectGoal:'Make a robot conversation that changes with the player’s replies.',knownSkills:['Text and quotation marks','Variables','Printing a message'],
   hint1:'The second question needs its own labeled box.',hint2:'Add animal = input("..."). Then use name and animal in print() calls.'});
 add('decisions','Ask for a Number','Ask for an age and print next year’s age.','input() returns text. int(input("Age? ")) turns a whole-number reply into a number.',
  'age = input("Age? ")\n# Convert the answer, then print next year’s age.','age = int(input("Age? "))\nprint(age + 1)',['input()','int()','addition'],['Convert an input with int()','Print the entered number plus 1'],'int-input',{mode:'Complete Code',inputs:['12']});
 add('decisions','Is It Even or Odd?','Ask for a number. Say whether it is even or odd.','An even number has remainder 0 when divided by 2. A block starts with : and its lines move right by 4 spaces.',
  'number = int(input("Number? "))\nif number % 2 == 0:\n    print("Even")\n# Add an else block.','number = int(input("Number? "))\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',['%','if / else','=='],['Use a remainder and a comparison','Print Even for 4 and Odd for 5'],'even',{mode:'Complete Code',inputs:['4'],testCases:[{inputs:['4'],contains:'even'},{inputs:['5'],contains:'odd'}]});
 add('decisions','Compare Scores','Ask for a score. The goal is 50 or more.','>= means greater than or equal to. > means greater than. < and <= look the other way.',
  'score = int(input("Score? "))\nif score >= 50:\n    print("Goal reached!")\n# Add the other choice.','score = int(input("Score? "))\nif score >= 50:\n    print("Goal reached!")\nelse:\n    print("Keep trying!")',['>=','if / else'],['Ask for a numeric score','Use >= 50','Print Goal for 50 and Keep trying for 49'],'compare',{mode:'Complete Code',inputs:['50'],testCases:[{inputs:['50'],contains:'goal'},{inputs:['49'],contains:'keep'}]});
 add('decisions','Two Choices','Ask for the weather. Say Take a hat for sun. Otherwise say Take a coat.','== asks whether two values match. != asks whether they do not match. = stores a value; it does not compare.',
  'weather = input("Weather? ")\n# Compare weather with "sun".','weather = input("Weather? ")\nif weather == "sun":\n    print("Take a hat")\nelse:\n    print("Take a coat")',['text input','==','if / else'],['Ask for text','Choose a hat for sun','Choose a coat for rain'],'choices',{mode:'Complete Code',inputs:['sun'],testCases:[{inputs:['sun'],contains:'hat'},{inputs:['rain'],contains:'coat'}]});
 add('decisions','Three Choices with elif','Give three messages for scores: 80+, 50+, and below 50.','elif checks a new choice only when the earlier choice did not match. Check the biggest goal first.',
  'score = int(input("Score? "))\nif score >= 80:\n    print("Great!")\n# Add elif and else.','score = int(input("Score? "))\nif score >= 80:\n    print("Great!")\nelif score >= 50:\n    print("Keep trying!")\nelse:\n    print("Practice more!")',['if / elif / else'],['Print Great for 80','Print Keep trying for 50','Print Practice more for 49'],'elif',{mode:'Complete Code',inputs:['80'],testCases:[{inputs:['80'],contains:'great'},{inputs:['50'],contains:'keep'},{inputs:['49'],contains:'practice'}]});
 add('decisions','Amusement Park Checker','Ask for height in cm. Help a visitor choose safely.','First check height > 200 for a special message. Then check height >= 120 for a ride. Otherwise say Too short.',
  'height = int(input("Height in cm? "))\n# Build your three choices.','height = int(input("Height in cm? "))\nif height > 200:\n    print("Special tall visitor!")\nelif height >= 120:\n    print("You can ride!")\nelse:\n    print("Too short for this ride.")',['int(input())','> and >=','if / elif / else'],['Ask for a numeric height','Check > 200 before >= 120','Handle 201, 200, 120, and 119 correctly'],'park',{challenge:true,inputs:['120'],testCases:[{inputs:['201'],contains:'special'},{inputs:['200'],contains:'ride'},{inputs:['120'],contains:'ride'},{inputs:['119'],contains:'short'}],bonus:['Add a separate age check','Invent a ride name']});
 add('loops','Print a Message 5 Times','Print the same friendly message five times.','for i in range(5): repeats a block five times. i takes values 0, 1, 2, 3, 4.',
  'for i in range(3):\n    print("Keep learning!")','for i in range(5):\n    print("Keep learning!")',['for','range(5)','indentation'],['Use a for loop','Print the same message exactly five times'],'five');
 add('loops','Count from 1 to 10','Print the numbers from 1 to 10.','range(1, 11) starts at 1 and stops before 11.',
  'for i in range(1, 5):\n    print(i)','for i in range(1, 11):\n    print(i)',['range(start, stop)'],['Use a for loop','Print 1 through 10 in order'],'ten');
 add('loops','Print Even Numbers','Print 2, 4, 6, 8, and 10.','range(2, 11, 2) moves by 2. Or use an if block with number % 2 == 0.',
  'for number in range(1, 11):\n    print(number)','for number in range(2, 11, 2):\n    print(number)',['for','range or %'],['Use a for loop','Print only 2, 4, 6, 8, 10'],'evens');
 add('loops','While Counter','Print 1, 2, 3. Change count each time.','while repeats while a condition is True. count += 1 adds one to the counter.',
  'count = 1\nwhile count <= 3:\n    print(count)\n    # Increase count here.','count = 1\nwhile count <= 3:\n    print(count)\n    count += 1',['while','counter update'],['Use a while loop','Print 1, 2, 3 and stop'],'counter',{mode:'Complete Code'});
 add('loops','Stop a While Loop','Repair this loop. It should print 1 through 5 and stop.','The condition needs a changing value. A missing update can make a loop repeat forever.',
  'count = 1\nwhile count <= 5:\n    print(count)','count = 1\nwhile count <= 5:\n    print(count)\n    count += 1',['while','stopping condition'],['Update the counter inside the block','Print 1 through 5 and stop'],'stop',{mode:'Complete Code',hint2:'Add count += 1 inside the while block, lined up with print(count).'});
 add('loops','Countdown and Cheer','Count down from 5 or 10 to 1. End with a cheer.','Subtract 1 each time in a while loop, or use range(start, 0, -1). A function packages reusable steps: def cheer(): starts a block; cheer() calls it.',
  '# Choose 5 or 10 as your start.\ncount = 5\n','count = 5\nwhile count > 0:\n    print(count)\n    count -= 1\nprint("Blast off!")',['for or while','a stopping condition','print()'],['Print a countdown from 5 or 10 to 1','Stop the loop','Print a positive cheer after the numbers'],'countdown',{challenge:true,bonus:['Ask for a starting number','Add an emoji','Try a function'],extra:'Lists hold several items: colors = ["blue", "green"]. print(colors[0]) shows blue. Try a list in your cheer.'});
 add('guess','Guess the Number','Python picks a secret number. Can the player guess it?','random.randint(1, 20) picks a whole number from 1 to 20. while repeats guesses. Run uses a random secret. Check uses secret 12 and your Test Inputs.',
  'import random\n\nsecret_number = random.randint(1, 20)\nguess = 0\n\nwhile guess != secret_number:\n    guess = int(input("Guess a number from 1 to 20: "))\n    # Add your if / elif / else code here.\n\nprint("You won!")',
  'import random\nsecret_number = random.randint(1, 20)\nguess = 0\nwhile guess != secret_number:\n    guess = int(input("Guess a number from 1 to 20: "))\n    if guess > secret_number:\n        print("Too high!")\n    elif guess < secret_number:\n        print("Too low!")\n    else:\n        print("Correct!")\nprint("You won!")',['random','input() and int()','conditions','while'],['Pick a secret with random.randint(1, 20)','Ask for guesses in a while loop','Give Too high! and Too low! hints','Say Correct! and end the game'],'guess',{
   mode:'Build It',project:true,inputs:['5','17','12'],projectGoal:'Build a playable game that guides a player to a secret number.',knownSkills:['Input and numeric variables','Comparisons and choices','Loops that stop'],
   buildSteps:['Read a guess in the loop','Build high and low clues','Celebrate a correct guess','Run and Check Project'],bonus:['Count the guesses','Add a You are very close! clue','Change the number range'],
   hint1:'Compare the guess with the secret. Each comparison needs its own message.',hint2:'Use if guess > secret_number, elif guess < secret_number, then else for the correct guess.'});
 units.forEach(unit=>unit.stepIds=steps.filter(step=>step.unitId===unit.id).map(step=>step.id));
 root.PythonLessons={units,steps};
 if(typeof module!=='undefined')module.exports=root.PythonLessons;
})(typeof globalThis!=='undefined'?globalThis:this);
