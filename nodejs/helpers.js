
// helper functions

exports.append_to_set = function(set1, set2) {
  for (var i = 0; i < set2.length; i++) {
    set1.push(set2[i]);
  } 
}

Array.prototype.pushArray = function(otherSet) {
  for (var i = 0; i < otherSet.length; i++)
    this.push(otherSet[i]);
}
