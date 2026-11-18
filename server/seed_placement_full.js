const db = require('./config/conn');

async function seedPlacementData() {
  console.log('🚀 Starting Placement Quiz Database Seeding in Supabase...');

  try {
    // 1. TOPICS (Placement)
    console.log('📦 Step 1: Configuring Placement Topics...');

    // Update topic 2 to Quantitative Aptitude
    await db.promise().query(
      `UPDATE topics 
       SET title = 'Quantitative Aptitude', 
           description = 'Quantitative Aptitude, Arithmetic & Mathematical Problem Solving',
           type = 'placement'
       WHERE topic_id = 2`
    );

    // Function to get or create topic
    async function getOrCreateTopic(title, description) {
      const [existing] = await db.promise().query(
        'SELECT topic_id FROM topics WHERE title = ? AND type = ?',
        [title, 'placement']
      );
      if (existing.length > 0) return existing[0].topic_id;
      const [created] = await db.promise().query(
        'INSERT INTO topics (title, description, added_by, by_admin, type) VALUES (?, ?, 1, 1, ?) RETURNING topic_id',
        [title, description, 'placement']
      );
      return created[0]?.topic_id || created.insertId;
    }

    const quantTopicId = 2;
    const reasoningTopicId = await getOrCreateTopic(
      'Logical Reasoning',
      'Logical, Analytical Reasoning & Puzzles'
    );
    const verbalTopicId = await getOrCreateTopic(
      'Verbal Ability',
      'Verbal Ability, Reading Comprehension & Business Communication'
    );
    const techTopicId = await getOrCreateTopic(
      'Technical & Core Coding',
      'Core CS Fundamentals, Data Structures, Algorithms, DBMS & Programming'
    );

    console.log('✅ Topics configured:', {
      quantTopicId,
      reasoningTopicId,
      verbalTopicId,
      techTopicId,
    });

    // 2. SUBTOPICS
    console.log('📦 Step 2: Configuring Subtopics...');
    async function getOrCreateSubtopic(topicId, title, description) {
      const [existing] = await db.promise().query(
        'SELECT sub_topic_id FROM sub_topics WHERE topic_id = ? AND title = ?',
        [topicId, title]
      );
      if (existing.length > 0) return existing[0].sub_topic_id;
      const [created] = await db.promise().query(
        'INSERT INTO sub_topics (topic_id, title, description, added_by, by_admin) VALUES (?, ?, ?, 1, 1) RETURNING sub_topic_id',
        [topicId, title, description]
      );
      return created[0]?.sub_topic_id || created.insertId;
    }

    const quantSubId = await getOrCreateSubtopic(
      quantTopicId,
      'Arithmetic & Applied Mathematics',
      'Percentages, Profit/Loss, Time & Work, Speed & Distance'
    );
    const reasoningSubId = await getOrCreateSubtopic(
      reasoningTopicId,
      'Analytical & Deductive Reasoning',
      'Series, Blood Relations, Syllogisms, Coding-Decoding'
    );
    const verbalSubId = await getOrCreateSubtopic(
      verbalTopicId,
      'English Grammar & Vocabulary',
      'Sentence Correction, Synonyms, Antonyms, Idioms'
    );
    const techSubId = await getOrCreateSubtopic(
      techTopicId,
      'Data Structures & CS Core',
      'DSA, DBMS, C/C++/Java, OS & Networking fundamentals'
    );

    console.log('✅ Subtopics configured:', {
      quantSubId,
      reasoningSubId,
      verbalSubId,
      techSubId,
    });

    // 3. TESTS
    console.log('📦 Step 3: Configuring Placement Tests...');
    async function getOrCreateTest(testId, title, description, subject, topicId, subTopicId, numQuestions) {
      if (testId) {
        const [existing] = await db.promise().query('SELECT test_id FROM tests WHERE test_id = ?', [testId]);
        if (existing.length > 0) {
          await db.promise().query(
            `UPDATE tests 
             SET title = ?, description = ?, subject = ?, topic_id = ?, sub_topic_id = ?, 
                 num_questions = ?, duration_minutes = 30, total_marks = ?, is_active = 1, type = 'placement'
             WHERE test_id = ?`,
            [title, description, subject, topicId, subTopicId, numQuestions, numQuestions, testId]
          );
          return testId;
        }
      }

      // Check by title
      const [existingByTitle] = await db.promise().query(
        'SELECT test_id FROM tests WHERE title = ? AND type = ?',
        [title, 'placement']
      );
      if (existingByTitle.length > 0) {
        const foundId = existingByTitle[0].test_id;
        await db.promise().query(
          `UPDATE tests 
           SET description = ?, subject = ?, topic_id = ?, sub_topic_id = ?, 
               num_questions = ?, duration_minutes = 30, total_marks = ?, is_active = 1
           WHERE test_id = ?`,
          [description, subject, topicId, subTopicId, numQuestions, numQuestions, foundId]
        );
        return foundId;
      }

      const [created] = await db.promise().query(
        `INSERT INTO tests 
         (title, description, subject, added_by, topic_id, sub_topic_id, num_questions, duration_minutes, is_active, total_marks, type)
         VALUES (?, ?, ?, 1, ?, ?, ?, 30, 1, ?, 'placement')
         RETURNING test_id`,
        [title, description, subject, topicId, subTopicId, numQuestions, numQuestions]
      );
      return created[0]?.test_id || created.insertId;
    }

    const test1Id = await getOrCreateTest(
      3,
      'Placement Aptitude 1',
      'Comprehensive Quantitative Aptitude module covering arithmetic, algebra, percentages, and time-work problems.',
      'Quantitative Aptitude',
      quantTopicId,
      quantSubId,
      25
    );

    const test2Id = await getOrCreateTest(
      null,
      'Placement Reasoning 1',
      'Logical, Analytical & Deductive reasoning module covering number series, blood relations, and puzzles.',
      'Logical Reasoning',
      reasoningTopicId,
      reasoningSubId,
      25
    );

    const test3Id = await getOrCreateTest(
      null,
      'Placement Verbal Ability 1',
      'Professional verbal communication and English language aptitude test.',
      'Verbal Ability',
      verbalTopicId,
      verbalSubId,
      25
    );

    const test4Id = await getOrCreateTest(
      null,
      'Placement Technical Core 1',
      'Technical assessment on Data Structures, Algorithms, C/C++, DBMS, and OS fundamentals.',
      'Technical & Core Coding',
      techTopicId,
      techSubId,
      25
    );

    console.log('✅ Placement Tests configured:', { test1Id, test2Id, test3Id, test4Id });

    // 4. QUESTIONS DEFINITION
    const quantQuestions = [
      {
        text: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
        a: '120 metres', b: '180 metres', c: '150 metres', d: '324 metres',
        correct: 'C'
      },
      {
        text: 'A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?',
        a: '3.6 km/hr', b: '7.2 km/hr', c: '8.4 km/hr', d: '10 km/hr',
        correct: 'B'
      },
      {
        text: 'If A can do a work in 10 days and B can do the same work in 15 days, in how many days can A and B together finish the work?',
        a: '5 days', b: '6 days', c: '7.5 days', d: '8 days',
        correct: 'B'
      },
      {
        text: 'A can do a piece of work in 4 hours; B and C together can do it in 3 hours, while A and C together can do it in 2 hours. How long will B alone take to do it?',
        a: '8 hours', b: '10 hours', c: '12 hours', d: '24 hours',
        correct: 'C'
      },
      {
        text: 'The cost price of 20 articles is the same as the selling price of x articles. If the profit is 25%, then the value of x is:',
        a: '15', b: '16', c: '18', d: '25',
        correct: 'B'
      },
      {
        text: 'In a certain store, the profit is 320% of the cost. If the cost increases by 25% but the selling price remains constant, approximately what percentage of the selling price is the profit?',
        a: '30%', b: '70%', c: '100%', d: '250%',
        correct: 'B'
      },
      {
        text: 'Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. The smaller number is:',
        a: '27', b: '33', c: '49', d: '55',
        correct: 'B'
      },
      {
        text: 'A sum of money at simple interest amounts to $815 in 3 years and to $854 in 4 years. The sum is:',
        a: '$650', b: '$690', c: '$698', d: '$700',
        correct: 'C'
      },
      {
        text: 'What is the compound interest on $10,000 for 2 years at 10% per annum, compounded annually?',
        a: '$2,000', b: '$2,100', c: '$2,200', d: '$1,800',
        correct: 'B'
      },
      {
        text: 'The average of 20 numbers is zero. Of them, at the most, how many may be greater than zero?',
        a: '0', b: '1', c: '10', d: '19',
        correct: 'D'
      },
      {
        text: 'The average age of 30 boys in a class is 14 years. When the age of the class teacher is included, the average becomes 15 years. What is the teacher\'s age?',
        a: '44 years', b: '45 years', c: '46 years', d: '42 years',
        correct: 'B'
      },
      {
        text: 'A basket contains 4 red, 5 blue, and 3 green marbles. If 2 marbles are drawn at random, what is the probability that both are red?',
        a: '1/11', b: '1/22', c: '2/11', d: '3/22',
        correct: 'A'
      },
      {
        text: 'In how many different ways can the letters of the word \'LEADING\' be arranged in such a way that the vowels always come together?',
        a: '360', b: '480', c: '720', d: '5040',
        correct: 'C'
      },
      {
        text: 'A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.',
        a: '2 hours', b: '3 hours', c: '4 hours', d: '5 hours',
        correct: 'C'
      },
      {
        text: 'A pipe can fill a tank in 15 hours and another pipe can empty it in 20 hours. If both pipes are opened together, in how many hours will the tank be full?',
        a: '30 hours', b: '45 hours', c: '60 hours', d: '75 hours',
        correct: 'C'
      },
      {
        text: 'What is 25% of 40% of 1200?',
        a: '120', b: '140', c: '150', d: '160',
        correct: 'A'
      },
      {
        text: 'If x is 20% less than y, then by what percentage is y more than x?',
        a: '20%', b: '25%', c: '30%', d: '16.66%',
        correct: 'B'
      },
      {
        text: 'Find the greatest number which on dividing 1657 and 2037 leaves remainders 6 and 5 respectively.',
        a: '123', b: '127', c: '235', d: '305',
        correct: 'B'
      },
      {
        text: 'The diagonal of a rectangle is 41 cm and its area is 20 cm^2. What is the perimeter of the rectangle?',
        a: '9 cm', b: '18 cm', c: '20 cm', d: '41 cm',
        correct: 'B'
      },
      {
        text: 'A wheel makes 1000 revolutions in covering a distance of 88 km. Find the radius of the wheel.',
        a: '7 m', b: '14 m', c: '21 m', d: '28 m',
        correct: 'B'
      },
      {
        text: 'The ratio between the perimeter and the breadth of a rectangle is 5 : 1. If the area of the rectangle is 216 sq. cm, what is the length of the rectangle?',
        a: '16 cm', b: '18 cm', c: '24 cm', d: '26 cm',
        correct: 'B'
      },
      {
        text: 'A and B invest in a business in the ratio 3 : 2. If 5% of the total profit goes to charity and A\'s share is $855, the total profit is:',
        a: '$1,425', b: '$1,500', c: '$1,537.50', d: '$1,575',
        correct: 'B'
      },
      {
        text: 'A rectangular courtyard 3.78 m long and 5.25 m broad is to be paved with square tiles of the same size. The minimum number of such tiles is:',
        a: '430', b: '440', c: '450', d: '460',
        correct: 'C'
      },
      {
        text: 'Find the odd man out in the sequence: 3, 5, 11, 14, 17, 21',
        a: '21', b: '17', c: '14', d: '3',
        correct: 'C'
      },
      {
        text: 'If log 2 = 0.30103, then the number of digits in 2^64 is:',
        a: '18', b: '19', c: '20', d: '21',
        correct: 'C'
      }
    ];

    const reasoningQuestions = [
      {
        text: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
        a: '(1/3)', b: '(1/8)', c: '(2/8)', d: '(1/16)',
        correct: 'B'
      },
      {
        text: 'Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?',
        a: '7', b: '10', c: '12', d: '13',
        correct: 'B'
      },
      {
        text: 'Look at this series: 36, 34, 30, 28, 24, ... What number should come next?',
        a: '20', b: '22', c: '23', d: '26',
        correct: 'B'
      },
      {
        text: 'Pointing to a photograph of a boy Suresh said, \'He is the son of the only son of my mother.\' How is Suresh related to that boy?',
        a: 'Brother', b: 'Uncle', c: 'Cousin', d: 'Father',
        correct: 'D'
      },
      {
        text: 'If A is the brother of B; B is the sister of C; and C is the father of D, how is D related to A?',
        a: 'Brother', b: 'Sister', c: 'Nephew or Niece', d: 'Cannot be determined',
        correct: 'C'
      },
      {
        text: 'In a certain code, \'COMPUTER\' is written as \'RFUVQNPC\'. How is \'MEDICINE\' written in that code?',
        a: 'MFEDJJOE', b: 'EOJDEJFM', c: 'MFEJDJOE', d: 'EOJDJEFM',
        correct: 'D'
      },
      {
        text: 'If \'ROSE\' is coded as 6821, \'CHAIR\' is coded as 73456 and \'PREACH\' is coded as 961473, what is the code for \'SEARCH\'?',
        a: '246173', b: '214673', c: '214763', d: '216473',
        correct: 'B'
      },
      {
        text: 'Statements: All cars are cats. All fans are cats. Conclusions: I. All cars are fans. II. Some fans are cars.',
        a: 'Only I follows', b: 'Only II follows', c: 'Either I or II follows', d: 'Neither I nor II follows',
        correct: 'D'
      },
      {
        text: 'Statements: Some actors are singers. All the singers are dancers. Conclusions: I. Some actors are dancers. II. No singer is actor.',
        a: 'Only (I) conclusion follows', b: 'Only (II) conclusion follows', c: 'Either (I) or (II) follows', d: 'Neither (I) nor (II) follows',
        correct: 'A'
      },
      {
        text: 'A man walks 5 km toward South and then turns to the right. After walking 3 km he turns to the left and walks 5 km. Now in which direction is he from the starting point?',
        a: 'West', b: 'South', c: 'North-East', d: 'South-West',
        correct: 'D'
      },
      {
        text: 'One morning after sunrise, Suresh was standing facing a pole. The shadow of the pole fell exactly to his right. To which direction was he facing?',
        a: 'East', b: 'West', c: 'South', d: 'North',
        correct: 'C'
      },
      {
        text: 'Five girls are sitting on a bench to be photographed. Seema is to the left of Rani and to the right of Bindu. Mary is to the right of Rani. Reeta is between Rani and Mary. Who is sitting immediately to the right of Reeta?',
        a: 'Bindu', b: 'Rani', c: 'Mary', d: 'Seema',
        correct: 'C'
      },
      {
        text: 'Find the missing term: B2CD, _____, BCD4, B5CD, BC6D',
        a: 'B2C2D', b: 'BC3D', c: 'B2C3D', d: 'BCD7',
        correct: 'B'
      },
      {
        text: 'Cup is to coffee as bowl is to:',
        a: 'Dish', b: 'Soup', c: 'Spoon', d: 'Food',
        correct: 'B'
      },
      {
        text: 'Which word does NOT belong with the others?',
        a: 'Tyre', b: 'Steering wheel', c: 'Engine', d: 'Car',
        correct: 'D'
      },
      {
        text: 'Which word does NOT belong with the other floral terms: Tulip, Rose, Bud, Daisy?',
        a: 'Tulip', b: 'Rose', c: 'Bud', d: 'Daisy',
        correct: 'C'
      },
      {
        text: 'If South-East becomes North, North-East becomes West and so on, what will West become?',
        a: 'North-East', b: 'South-East', c: 'North-West', d: 'South-West',
        correct: 'B'
      },
      {
        text: 'A is 3 years older to B and 3 years younger to C, while B and D are twins. How many years older is C to D?',
        a: '3', b: '6', c: '9', d: '12',
        correct: 'B'
      },
      {
        text: 'Choose the correct alternative: Peacock : India :: Emu : ?',
        a: 'Australia', b: 'America', c: 'Russia', d: 'England',
        correct: 'A'
      },
      {
        text: 'In a row of trees, one tree is fifth from either end of the row. How many trees are there in the row?',
        a: '8', b: '9', c: '10', d: '11',
        correct: 'B'
      },
      {
        text: 'Sonia introduces a man as the son of the brother of her mother. How is the man related to Sonia?',
        a: 'Nephew', b: 'Son', c: 'Cousin', d: 'Uncle',
        correct: 'C'
      },
      {
        text: 'Statement: The principal instructed all teachers to be punctual in reporting to school. Assumptions: I. Some teachers were not coming on time. II. Teachers will follow the instruction.',
        a: 'Only assumption I is implicit', b: 'Only assumption II is implicit', c: 'Either I or II is implicit', d: 'Both I and II are implicit',
        correct: 'D'
      },
      {
        text: 'Find the next pair: ELFA, GLHA, ILJA, _____, MLNA',
        a: 'OLPA', b: 'KLMA', c: 'LLMA', d: 'KLLA',
        correct: 'D'
      },
      {
        text: 'If P denotes \'divided by\', T denotes \'add\', M denotes \'subtract\', and D denotes \'multiplied by\', then: 12 M 12 D 28 P 7 T 15 = ?',
        a: '-21', b: '39', c: '-45', d: '15',
        correct: 'A'
      },
      {
        text: 'A, B and C have money. If A takes 6 from C, A has equal to B. If A+B=74 and B+C=84, how much does A have?',
        a: '32', b: '34', c: '36', d: '38',
        correct: 'B'
      }
    ];

    const verbalQuestions = [
      {
        text: 'Choose the synonym for: CANDID',
        a: 'Secretive', b: 'Frank', c: 'Shy', d: 'Cruel',
        correct: 'B'
      },
      {
        text: 'Choose the antonym for: ENORMOUS',
        a: 'Soft', b: 'Average', c: 'Tiny', d: 'Weak',
        correct: 'C'
      },
      {
        text: 'Choose the correctly spelled word:',
        a: 'Accomodation', b: 'Accommodation', c: 'Acommodation', d: 'Accomadation',
        correct: 'B'
      },
      {
        text: 'Identify the error: Neither of the plans (A) / suit him (B) / so he decided (C) / not to invest (D)',
        a: 'Neither of the plans', b: 'suit him', c: 'so he decided', d: 'not to invest',
        correct: 'B'
      },
      {
        text: 'Fill in the blank: The manager was pleased _____ the employee\'s dedication.',
        a: 'by', b: 'with', c: 'at', d: 'on',
        correct: 'B'
      },
      {
        text: 'Choose the meaning of the idiom: \'To burn the candle at both ends\'',
        a: 'To waste resources recklessly', b: 'To work extremely hard from morning to night', c: 'To be enlightened', d: 'To create double danger',
        correct: 'B'
      },
      {
        text: 'Choose the synonym for: METICULOUS',
        a: 'Careful and precise', b: 'Careless', c: 'Hasty', d: 'Aggressive',
        correct: 'A'
      },
      {
        text: 'Choose the antonym for: ARROGANT',
        a: 'Proud', b: 'Humble', c: 'Selfish', d: 'Bold',
        correct: 'B'
      },
      {
        text: 'Fill in the blank: She has been living in this city _____ 2015.',
        a: 'for', b: 'from', c: 'since', d: 'in',
        correct: 'C'
      },
      {
        text: 'Select the correctly punctuated sentence:',
        a: 'Although he was tired he finished the project.', b: 'Although he was tired, he finished the project.', c: 'Although, he was tired he finished the project.', d: 'Although he was tired; he finished the project.',
        correct: 'B'
      },
      {
        text: 'What is the meaning of the idiom: \'A blessing in disguise\'?',
        a: 'A misfortune that unexpectedly results in something good', b: 'A secret enemy', c: 'A gift given anonymously', d: 'A bad omen',
        correct: 'A'
      },
      {
        text: 'Choose the correct passive voice: \'The chef prepares delicious meals.\'',
        a: 'Delicious meals were prepared by the chef.', b: 'Delicious meals are prepared by the chef.', c: 'Delicious meals have been prepared by the chef.', d: 'Delicious meals are being prepared by the chef.',
        correct: 'B'
      },
      {
        text: 'Choose the correct indirect speech: He said, \'I am learning Python.\'',
        a: 'He said that he is learning Python.', b: 'He said that he was learning Python.', c: 'He said that I was learning Python.', d: 'He says that he was learning Python.',
        correct: 'B'
      },
      {
        text: 'Choose the word which can be substituted for: \'A person who speaks many languages\'',
        a: 'Linguist', b: 'Polyglot', c: 'Grammarian', d: 'Bilingual',
        correct: 'B'
      },
      {
        text: 'Choose the word which can be substituted for: \'One who looks on the bright side of things\'',
        a: 'Pessimist', b: 'Optimist', c: 'Pacifist', d: 'Altruist',
        correct: 'B'
      },
      {
        text: 'Identify the error: She has been working (A) / on this research (B) / since three years (C) / with great passion (D)',
        a: 'She has been working', b: 'on this research', c: 'since three years', d: 'with great passion',
        correct: 'C'
      },
      {
        text: 'Choose the synonym for: ADVERSITY',
        a: 'Hardship', b: 'Prosperity', c: 'Victory', d: 'Opportunity',
        correct: 'A'
      },
      {
        text: 'Choose the antonym for: OBSOLETE',
        a: 'Ancient', b: 'Contemporary', c: 'Outdated', d: 'Extinct',
        correct: 'B'
      },
      {
        text: 'Fill in the blank: He is proficient _____ both Java and Python.',
        a: 'at', b: 'in', c: 'with', d: 'on',
        correct: 'B'
      },
      {
        text: 'Choose the grammatically correct sentence:',
        a: 'Each of the students have submitted their assignment.', b: 'Each of the students has submitted his or her assignment.', c: 'Each of the student has submitted their assignment.', d: 'Each students have submitted their assignments.',
        correct: 'B'
      },
      {
        text: 'Select the antonym for: BENEVOLENT',
        a: 'Generous', b: 'Malevolent', c: 'Helpful', d: 'Gracious',
        correct: 'B'
      },
      {
        text: 'Meaning of the idiom: \'Bite the bullet\':',
        a: 'To accept a difficult situation with courage', b: 'To fight aggressively', c: 'To suffer toothache', d: 'To commit suicide',
        correct: 'A'
      },
      {
        text: 'Choose the synonym for: PRAGMATIC',
        a: 'Theoretical', b: 'Practical', c: 'Idealistic', d: 'Romantic',
        correct: 'B'
      },
      {
        text: 'Choose the correct spelling:',
        a: 'Conscientious', b: 'Consciencious', c: 'Consientious', d: 'Conscenteous',
        correct: 'A'
      },
      {
        text: 'Choose the correct prepositions: The book is _____ the table, _____ the lamp.',
        a: 'on, near', b: 'at, beside', c: 'in, under', d: 'over, into',
        correct: 'A'
      }
    ];

    const techQuestions = [
      {
        text: 'Which data structure follows the LIFO (Last In First Out) principle?',
        a: 'Queue', b: 'Stack', c: 'Array', d: 'Linked List',
        correct: 'B'
      },
      {
        text: 'What is the worst-case time complexity of QuickSort?',
        a: 'O(n log n)', b: 'O(n)', c: 'O(n^2)', d: 'O(log n)',
        correct: 'C'
      },
      {
        text: 'What is the average time complexity of searching an element in a Hash Table?',
        a: 'O(1)', b: 'O(log n)', c: 'O(n)', d: 'O(n log n)',
        correct: 'A'
      },
      {
        text: 'Which of the following is NOT an Object-Oriented Programming pillar?',
        a: 'Encapsulation', b: 'Inheritance', c: 'Polymorphism', d: 'Compilation',
        correct: 'D'
      },
      {
        text: 'In C, what is the size of an integer pointer on a 64-bit operating system?',
        a: '2 bytes', b: '4 bytes', c: '8 bytes', d: 'Depends on compiler optimization',
        correct: 'C'
      },
      {
        text: 'Which traversal of a Binary Search Tree (BST) visits nodes in ascending sorted order?',
        a: 'Pre-order', b: 'In-order', c: 'Post-order', d: 'Level-order',
        correct: 'B'
      },
      {
        text: 'In SQL, which clause is used to filter groups created by the GROUP BY clause?',
        a: 'WHERE', b: 'HAVING', c: 'ORDER BY', d: 'FILTER',
        correct: 'B'
      },
      {
        text: 'Which ACID property guarantees that a transaction will either completely succeed or be completely rolled back?',
        a: 'Atomicity', b: 'Consistency', c: 'Isolation', d: 'Durability',
        correct: 'A'
      },
      {
        text: 'What will be the output of sizeof(\'a\') in C language?',
        a: '1', b: '2', c: '4', d: 'Compiler error',
        correct: 'C'
      },
      {
        text: 'Which SQL keyword is used to eliminate duplicate rows from a query result?',
        a: 'UNIQUE', b: 'DISTINCT', c: 'DIFFERENT', d: 'ISOLATE',
        correct: 'B'
      },
      {
        text: 'Which memory segment stores dynamically allocated memory in C/C++ (via malloc or new)?',
        a: 'Stack', b: 'Heap', c: 'Data Segment', d: 'Code Segment',
        correct: 'B'
      },
      {
        text: 'What is a deadlock in Operating Systems?',
        a: 'A process consuming 100% CPU', b: 'Two or more processes waiting indefinitely for resources held by each other', c: 'A crashed disk sector', d: 'A memory leak',
        correct: 'B'
      },
      {
        text: 'Which layer of the OSI model is responsible for end-to-end packet routing and IP addressing?',
        a: 'Data Link Layer', b: 'Network Layer', c: 'Transport Layer', d: 'Application Layer',
        correct: 'B'
      },
      {
        text: 'Which protocol operates at the Transport Layer and provides reliable, connection-oriented data transfer?',
        a: 'UDP', b: 'IP', c: 'TCP', d: 'ICMP',
        correct: 'C'
      },
      {
        text: 'In Python, which of the following data types is immutable?',
        a: 'List', b: 'Dictionary', c: 'Tuple', d: 'Set',
        correct: 'C'
      },
      {
        text: 'What does the C expression evaluate to? int x = 5; printf("%d", x++);',
        a: '5', b: '6', c: 'Undefined', d: '0',
        correct: 'A'
      },
      {
        text: 'What is the primary advantage of a Doubly Linked List over a Singly Linked List?',
        a: 'Consumes less memory', b: 'Bidirectional traversal (can traverse backward)', c: 'O(1) search time', d: 'Contiguous memory caching',
        correct: 'B'
      },
      {
        text: 'Which scheduling algorithm in Operating Systems can lead to starvation for long processes?',
        a: 'First Come First Served (FCFS)', b: 'Round Robin', c: 'Shortest Job First (SJF)', d: 'FIFO',
        correct: 'C'
      },
      {
        text: 'What does the HTTP status code 404 signify?',
        a: 'Internal Server Error', b: 'Unauthorized Access', c: 'Resource Not Found', d: 'Bad Gateway',
        correct: 'C'
      },
      {
        text: 'In Java, what is the default value of an uninitialized boolean instance variable?',
        a: 'true', b: 'false', c: 'null', d: '0',
        correct: 'B'
      },
      {
        text: 'Which data structure is typically used to implement Breadth-First Search (BFS) on a graph?',
        a: 'Stack', b: 'Queue', c: 'Priority Queue', d: 'Binary Tree',
        correct: 'B'
      },
      {
        text: 'What is the time complexity to insert an element at the beginning of an Array of size n?',
        a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n^2)',
        correct: 'B'
      },
      {
        text: 'In relational databases, what is a Foreign Key?',
        a: 'A key generated by external tools', b: 'A column or combination of columns referring to the Primary Key of another table', c: 'An encrypted column', d: 'A column with no unique constraints',
        correct: 'B'
      },
      {
        text: 'Which design pattern ensures that a class has only one instance and provides a global point of access to it?',
        a: 'Factory Pattern', b: 'Observer Pattern', c: 'Singleton Pattern', d: 'Adapter Pattern',
        correct: 'C'
      },
      {
        text: 'What is the result of binary addition 1011 + 0101 in decimal?',
        a: '14', b: '16', c: '18', d: '20',
        correct: 'B'
      }
    ];

    // Helper to insert questions and map to test
    async function insertAndMapQuestions(testId, subTopicId, questionsList) {
      console.log(`📝 Inserting ${questionsList.length} questions for Test ${testId}...`);

      // First check if test already has questions
      const [existingTQ] = await db.promise().query(
        'SELECT count(*) as count FROM test_questions WHERE test_id = ?',
        [testId]
      );
      const existingCount = Number(existingTQ[0]?.count || 0);
      if (existingCount >= questionsList.length) {
        console.log(`ℹ️ Test ${testId} already has ${existingCount} questions mapped. Skipping re-insert.`);
        return;
      }

      // Clear any partial mappings for this test to avoid stale state
      await db.promise().query('DELETE FROM test_questions WHERE test_id = ?', [testId]);

      const questionIds = [];
      for (const q of questionsList) {
        // Check if question text already exists in subtopic
        const [existingQ] = await db.promise().query(
          'SELECT question_id FROM questions WHERE sub_topic_id = ? AND question_text = ?',
          [subTopicId, q.text]
        );

        let qId;
        if (existingQ.length > 0) {
          qId = existingQ[0].question_id;
        } else {
          const [inserted] = await db.promise().query(
            `INSERT INTO questions 
             (sub_topic_id, created_by, by_admin, question_text, option_a, option_b, option_c, option_d, correct_option, mark)
             VALUES (?, 1, 1, ?, ?, ?, ?, ?, ?, 1)
             RETURNING question_id`,
            [subTopicId, q.text, q.a, q.b, q.c, q.d, q.correct]
          );
          qId = inserted[0]?.question_id || inserted.insertId;
        }
        questionIds.push(qId);
      }

      // Insert mappings into test_questions
      for (const qId of questionIds) {
        await db.promise().query(
          'INSERT INTO test_questions (test_id, question_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
          [testId, qId]
        );
      }

      // Update test question count
      await db.promise().query(
        'UPDATE tests SET num_questions = ?, total_marks = ? WHERE test_id = ?',
        [questionIds.length, questionIds.length, testId]
      );

      console.log(`✅ Successfully mapped ${questionIds.length} questions to Test ${testId}!`);
    }

    await insertAndMapQuestions(test1Id, quantSubId, quantQuestions);
    await insertAndMapQuestions(test2Id, reasoningSubId, reasoningQuestions);
    await insertAndMapQuestions(test3Id, verbalSubId, verbalQuestions);
    await insertAndMapQuestions(test4Id, techSubId, techQuestions);

    console.log('🎉 ALL PLACEMENT DATA SEEDED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during placement seeding:', err);
    process.exit(1);
  }
}

seedPlacementData();

