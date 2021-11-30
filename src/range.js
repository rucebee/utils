export default function (a, b, fn) {
  return period => {
    //console.log(period)
    fn(a + period * (b - a))
  }
}
