import { useEffect, useCallback, useRef } from 'react';

/**
 * 与useEffect类似，可以接受一个Generator函数callback，
 * callback函数中可以 yield Promise，与async函数中的await Promise功能相同
 * 
 * 当deps发生变化或Component被卸载的时候，
 * 这个Generator函数的执行会中断在当前的yield位置。
 * 中断时既不执行下一个语句，也不抛出异常，
 * 但finally块在中断后仍会被执行。
 * 
 * callback函数的finally块中可以使用isCancelled检查
 * 当前执行过程是否被取消
 * 
 * @param { (isCancelled: () => boolean) => Generator<Promise<any>, (() => void) | void, any> } callback 
 * @param { any[] } deps 
 */
export function useCoEffect(callback, deps = []) {
    // @ts-ignore
    if (typeof callback !== 'function' || (callback.constructor.displayName || callback.constructor.name) !== 'GeneratorFunction') {
        throw new Error("useCo only accepts generator function");
    }
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const cancel = runCo(callback, []);
        //如果在Generator中进行了setState，触发了清除effect，
        //可能会同步执行到此处，就会造成重复进入Generator的错误。
        //因此取消Generator需要异步进行
        return () => setImmediate(() => cancel());
    }, deps);
}

/**
 * @template {(...args) => any} T
 * @typedef {T extends (a, ...b: infer I) => void ? I : []} TailParameters */

/**
 * 与useCallback类似，可以接受一个Generator函数callback，
 * callback函数中可以 yield Promise，与async函数中的await Promise功能相同
 * 
 * 当deps发生变化或Component被卸载的时候，
 * 这个Generator函数的执行会中断在当前的yield位置。
 * 中断时既不执行下一个语句，也不抛出异常，
 * 但finally块在中断后仍会被执行。
 * 
 * callback函数的finally块中可以使用isCancelled检查
 * 当前执行过程是否被取消
 * 
 * @template {(isCancelled: () => boolean, ...args) =>  Generator<Promise<any>, (() => void) | void, any> } T
 * @param {T} callback 
 * @param {any[]} deps 
 * @returns {(...args: TailParameters<T>) => void}
 */
export function useCoCallback(callback, deps) {
    // @ts-ignore
    if (typeof callback !== 'function' || (callback.constructor.displayName || callback.constructor.name) !== 'GeneratorFunction') {
        throw new Error("useCoCallback only accepts generator function");
    }
    const cancelRef = useRef(() => {});
    useEffect(() => {
        return () => setImmediate(() => cancelRef.current());
    }, deps);

    /** @type {(...args:TailParameters<T>) => void} */
    const r = useCallback((...args) => {
        cancelRef.current();
        cancelRef.current = runCo(callback, args);
    }, deps);
    return r;
}

/**
 * @template {(isCancelled: () => boolean, ...args) =>  Generator<Promise<any>, (() => void) | void, any> } T
 * @param {T} callback 
 * @param {TailParameters<T>} args 
 */
function runCo(callback, args) {    
    let cancelled;
    let cancelStep = function dummy(){};
    let finished = false;
    let finishedValue;
    const iter = callback(isCancelled, ...args);
    step(false, undefined, undefined);
    return cancel;
    
    function cancel() {
        if (finished) {
            if (typeof finishedValue === 'function') {
                finishedValue();
            }
        } else {
            cancelled = true;
            cancelStep();
        }
    }

    function isCancelled() {
        return cancelled;
    }
    
    function step(prevCancelled, prevError, prevValue) {
        let value, done;
        try {
            if (prevCancelled) {
                ({ value, done } = iter.return());
            } else if (prevError) {
                ({ value, done } = iter.throw(prevError));
            } else {
                ({ value, done } = iter.next(prevValue));
            }
        } catch (e) {
            console.warn("Uncaught exception in useCo", e);
            return;
        }
        if (done) {
            finished = true;
            finishedValue = value;
            return;
        }
        let cancelled = false;
        const p = Promise.resolve(value);    
        p.then(r => {
            if (cancelled) return;
            step(false, undefined, r);
        }).catch(e => {
            if (cancelled) return;
            step(false, e, undefined);
        });
        cancelStep = () => {
            if (cancelled) return;
            cancelled = true;
            step(true, undefined, undefined);
        }
    }
}