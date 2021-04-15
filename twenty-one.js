const readline = require('readline-sync');
const MESSAGES = require('./twenty-one-msgs.json');
const CARD_VALUES = require('./twenty-one-cards.json');
const NUM_SUITS = 4;
const INIT_HAND_SIZE = 2;
const DEALER_MIN = 17;
const BUST = 21;

const INPUT_TESTS = {
  bestOf: input => {
    return (
      Number.isNaN(Number(input)) ||
      !Number.isInteger(Number(input)) ||
      Number(input) % 2 === 0 ||
      Number(input) <= 0 ||
      Number(input) > 10
    );
  },
  hitOrStay: input => !['h', 'hit', 's', 'stay'].includes(input.toLowerCase()),
  nextRound: input => !!input,
  playAgain: input => !['y', 'yes', 'n', 'no'].includes(input.toLowerCase()),
};

function generateDeck() {
  let deck = [];
  let cardNames = Object.keys(CARD_VALUES);
  for (let suit = 0; suit < NUM_SUITS; suit += 1) {
    deck = deck.concat(cardNames);
  }
  return deck;
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index--) {
    let otherIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[otherIndex]] = [array[otherIndex], array[index]];
  }
}

function getTwoFromDeck(deck) {
  let hand = [];
  for (let dealtCard = 0; dealtCard < INIT_HAND_SIZE; dealtCard += 1) {
    hand.push(deck[dealtCard]);
  }
  deck.splice(0, INIT_HAND_SIZE);
  return hand;
}

function total(hand) {
  let handValues = hand.map(card => CARD_VALUES[card]);
  let total = handValues.reduce((sum, value) => sum + value, 0);
  while (total > BUST && handValues.includes(11)) {
    convertAce(handValues);
    total = handValues.reduce((sum, value) => sum + value, 0);
  }
  return total;
}

function convertAce(valuesArr) {
  valuesArr.splice(valuesArr.indexOf(11), 1, 1);
}

function userTurn(userHand, dealerHand, deck, bestOf, scores) {
  while (total(userHand) <= BUST) {
    console.clear();
    displayScoreBoard(bestOf, scores);
    displayTable(userHand, dealerHand);

    let move = getUserInput('hitOrStay');

    if (['hit', 'h'].includes(move)) {
      hit(userHand, deck);
    } else if (['stay', 's'].includes(move)) {
      break;
    }
  }
}

function displayScoreBoard(bestOf, scores) {
  let user = scores['user'];
  let dealer = scores['dealer'];
  let cap = Math.ceil(bestOf / 2);
  console.log(`User: ${user}, Dealer: ${dealer} (First to ${cap} wins)`);
  console.log('');
}

function displayTable(userHand, dealerHand) {
  console.log(`   Your hand: ${userHand.join(', ')}`);
  console.log(`Dealers hand: ${dealerHand[0]} and one unknown card`);
  console.log('');
}

function getUserInput(type) {
  let input = readline.question(MESSAGES[type]);
  while (INPUT_TESTS[type](input)) {
    input = readline.question(MESSAGES[`${type}Invalid`]);
  }
  return input.toLowerCase();
}

function hit(hand, deck) {
  hand.push(deck[0]);
  deck.splice(0, 1);
}

function dealerTurn(dealerHand, deck) {
  while (total(dealerHand) < DEALER_MIN) {
    hit(dealerHand, deck);
  }
}

function displayFinalTable(userHand, dealerHand, bestOf, scores) {
  console.clear();
  displayScoreBoard(bestOf, scores);

  let userHandStr = `   Your hand: ${userHand.join(', ')}`;
  let dealerHandStr = `Dealers hand: ${dealerHand.join(', ')}`;

  let longestStrEnd = Math.max(userHandStr.length, dealerHandStr.length);
  let safeToPrint = longestStrEnd + 3;

  userHandStr += ' '.repeat(safeToPrint - userHandStr.length);
  dealerHandStr += ' '.repeat(safeToPrint - dealerHandStr.length);

  console.log(userHandStr + `= ${total(userHand)} points`);
  console.log(dealerHandStr + `= ${total(dealerHand)} points`);
  console.log(getWinner(userHand, dealerHand));
}

function getWinner(userHand, dealerHand) {
  let userTotal = total(userHand);
  let dealerTotal = total(dealerHand);

  if (userTotal > BUST) {
    return '\n      RESULT: YOU BUST';
  } else if (dealerTotal > BUST) {
    return '\n      RESULT: YOU WIN';
  } else if (userTotal > dealerTotal) {
    return '\n      RESULT: YOU WIN';
  } else {
    return '\n      RESULT: YOU LOSE';
  }
}

function updateScores(userHand, dealerHand, scores) {
  let gameResult = getWinner(userHand, dealerHand);

  if (
    gameResult === '\n      RESULT: YOU BUST' ||
    gameResult === '\n      RESULT: YOU LOSE'
  ) {
    scores['dealer'] += 1;
  } else if (gameResult === '\n      RESULT: YOU WIN') {
    scores['user'] += 1;
  }
}

function isMatchOver(scores, bestOf) {
  return (
    scores['user'] === Math.ceil(bestOf / 2) ||
    scores['dealer'] === Math.ceil(bestOf / 2)
  );
}

function displayOverallWinner(scores, bestOf) {
  if (scores['user'] === Math.ceil(bestOf / 2)) {
    console.log('\n         CONGRATS!');
  } else if (scores['dealer'] === Math.ceil(bestOf / 2)) {
    console.log('\n         GAME OVER');
  }
}

function isReplay(input) {
  return ['y', 'yes'].includes(input);
}

while (true) {
  console.clear();
  console.log('Welcome to 21!');
  let bestOf = Number(getUserInput('bestOf'));
  let scores = { user: 0, dealer: 0 };

  while (!isMatchOver(scores, bestOf)) {
    let deck = generateDeck();
    shuffle(deck);

    let userHand = getTwoFromDeck(deck);
    let dealerHand = getTwoFromDeck(deck);

    userTurn(userHand, dealerHand, deck, bestOf, scores);
    dealerTurn(dealerHand, deck);

    updateScores(userHand, dealerHand, scores);
    displayFinalTable(userHand, dealerHand, bestOf, scores);

    if (!isMatchOver(scores, bestOf)) {
      getUserInput('nextRound');
    }
  }
  displayOverallWinner(scores, bestOf);
  let playAgain = getUserInput('playAgain');
  if (!isReplay(playAgain)) { break }
}