
// get a random number/other randomness

exports.randomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
