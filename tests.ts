import { VM, True, False, N_1, N_3, N_5, N_15, Line } from './vm';

type _ = '';

type FizzBuzz = VM<[
    ['push', N_1],         // 1
    ['push', False],       // 2
    ['peek', _],           // 3
    ['mod', N_3],          // 4
    ['ifNZero', Line<8>],  // 5
    ['replace', True],     // 6
    ['print', 'fizz'],     // 7
    ['peek', _],           // 8
    ['mod', N_5],          // 9
    ['ifNZero', Line<13>], // 10
    ['replace', True],     // 11
    ['print', 'buzz'],     // 12
    ['ifNZero', Line<15>], // 13
    ['printHead', _],      // 14
    ['eq', N_15],          // 15
    ['ifNZero', Line<19>], // 16
    ['inc', _],            // 17
    ['jump', Line<2>],     // 18
    ['pop', _],            // 19
    ['stop', _]            // 20
  ]>;

interface TestFizzBuzz {
    expected: {
        stdOut: ['1', '2', 'fizz', '4', 'buzz', 'fizz', '7', '8', 'fizz', 'buzz', '11', 'fizz', '13', '14', 'fizz', 'buzz']
    }
    actual: TestFizzBuzz['expected']
}
interface TestFizzBuzz {
    actual: FizzBuzz
}
