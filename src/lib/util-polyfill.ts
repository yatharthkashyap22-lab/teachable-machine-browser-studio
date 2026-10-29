export function promisify(fn: Function) {
  return function (this: any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      fn.apply(this, [
        ...args,
        (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      ]);
    });
  };
}

export default { promisify };
