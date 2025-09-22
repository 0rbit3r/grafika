// computes viable textBox radius from the text length
// todo - this doesn't work very well, especially when new lines are involved - either improve the calculation or
// for the sake of sanity disallow new lines (new line = new node anyway?)
export const computeTextBoxRadius = (text: string) => {
    const textLength = text.length;

    const numberOfNewLines = text.split('\n').length - 1;

    console.log("new lines = " + numberOfNewLines);
    return Math.floor(Math.max(20, Math.sqrt(textLength * 0.85) * 3.8 + 10));
};

// This is just a best human-effort at fitting curves through a bunch of datapoints:
// 5 10
// 20 20
// 50 35 
// 100 50
// 200 60
// 400 80
// 800 105
// 1600 150
// 3200 204
// 6400 285

// Your milage may vary...
// In practice it might be pragmatic to just increase or even double the radius every n letters or something