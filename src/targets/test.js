const array = [1, 2, 3, 4, 5];

// checks whether an element is even
const even = (element) => element % 2 === 0;

const arr = array.filter(even);

console.log(arr);
// expected output: true
