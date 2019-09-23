import {Head, Prepend, Reverse, Tail} from './utils'

type No_Arg = any;
type Instruction_Address = any[]; // use array['length'] to index into Program's instructions
type B = 1 | 0;
type BITS_4 = [B, B, B, B];
type Num = BITS_4;

type Instructions =
  | ["push", Num]                    // [h, ...t]     ->  [arg, h, ...t]
  | ["pop", No_Arg]                  // [h, ...t]     ->  [...t]
  | ["dup", No_Arg]                  // [h, ...t]     ->  [h, h, ...t]
  | ["peek", No_Arg]                 // [h, hh, ...t] ->  [hh, h, hh, ...t]
  | ["replace", Num]                 // [h, ...t]     ->  [arg, ...t]
  | ["inc", No_Arg]                  // [h, ...t]     ->  [++h, ...t]
  | ["mod", Num]                     // [h, ...t]     ->  [h % arg, ...t]
  | ["eq", Num]                      // [h, ...t]     ->  [h == arg, h, ...t]
  | ["jump", Instruction_Address]    // jump program to instruction at arg
  | ["ifNZero", Instruction_Address] // pop head, if != 0 jump program to instruction at arg
  | ["printHead", No_Arg]            // copy head, covert to string then add to stdout
  | ["print", string]                // add arg to stdout
  | ["stop", No_Arg];                // halt! returns contents of stdout

/**
 * This is the main entry point to run the Virtual Machine
 * @param Program - The array of instructions to execute
 * @returns { stdOut: string[] }
 */
export type VM<
  Program extends Instructions[],
  /* variables: */
  Result extends any = InnerVM<Program>
> = {
  // Use a trampoline to extend TypeScript's Type Instantiation depth limit of 50
  1: VM<Program, InnerVM<Program, [], Result>>;
  0: Result["state"];
}[Result["tag"] extends "bounce" ? 1 : 0];

type InnerVM<
  Program extends Instructions[],
  Bounces extends any[] = [],
  Result extends any = Tick<Program>
> = {
  // Use two trampolines to further increase limit...
  1: InnerVM<Program, Prepend<any, Bounces>,
       Tick<Result["state"][0], Result["state"][1], Result["state"][2], Result["state"][3]>
     >;
  0: Result;
}[Result["tag"] extends "bounce"
  ? (Bounces['length'] extends 5
    ? 0
    : 1)
  : 0];

// Execute the next instruction
type Tick<
  Program extends Instructions[],
  PC extends any[] = [], // program-counter - length of array indexes into Instructions
  Stack extends Num[] = [],
  StdOut extends string[] = []
> = {
  // Define all the VM instructions
  'push': Tick<Program, Prepend<any, PC>, Prepend<Program[PC["length"]][1], Stack>, StdOut>;
  'pop': Tick<Program, Prepend<any, PC>, Tail<Stack>, StdOut>;
  'dup': Tick<Program, Prepend<any, PC>, Prepend<Head<Stack>, Stack>, StdOut>;
  'peek': Tick<Program, Prepend<any, PC>, Prepend<Head<Tail<Stack>>, Stack>, StdOut>;
  'replace': Tick<Program, Prepend<any, PC>, Prepend<Program[PC["length"]][1], Tail<Stack>>, StdOut>;
  'inc': Tick<Program, Prepend<any, PC>, Prepend<ADD_4<Head<Stack>, N_1>, Tail<Stack>>, StdOut>;
  // @ts-ignore - convince TypeScript that division is not infinite
  'mod': Tick<Program, Prepend<any, PC>, Prepend<MOD_4<Head<Stack>, Program[PC["length"]][1]>, Tail<Stack>>, StdOut>;
  'eq': Tick<Program, Prepend<any, PC>, Prepend<EQ_4<Head<Stack>, Program[PC["length"]][1]>, Stack>, StdOut>;
  // 'jump' seems as good a natural time to bounce on the trampoline
  'jump': { tag: "bounce"; state: [Program, Program[PC["length"]][1], Stack, StdOut] };
  'ifNZero': Head<Stack> extends N_0
    ? Tick<Program, Prepend<any, PC>, Tail<Stack>, StdOut>
    : Tick<Program, Program[PC["length"]][1], Tail<Stack>, StdOut>;
  'printHead': Tick<Program, Prepend<any, PC>, Stack, Prepend<N_ToString<Head<Stack>>, StdOut>>;
  'print': Tick<Program, Prepend<any, PC>, Stack, Prepend<Program[PC["length"]][1], StdOut>>;
  'stop': { tag: "result"; state: { stdOut: Reverse<StdOut> } };
  // Then index into the correct instruction based on the current program-counter (PC)
}[Program[PC["length"]][0]];

// 4-Bit Arithmetic Logic Unit (ALU)
// - handle numbers 0 to 15
// - everything constructed from 1-bit logic gates

export type N_0 = [0, 0, 0, 0];
export type N_1 = [1, 0, 0, 0];
export type N_2 = [0, 1, 0, 0];
export type N_3 = [1, 1, 0, 0];
export type N_4 = [0, 0, 1, 0];
export type N_5 = [1, 0, 1, 0];
export type N_6 = [0, 1, 1, 0];
export type N_7 = [1, 1, 1, 0];
export type N_8 = [0, 0, 0, 1];
export type N_9 = [1, 0, 0, 1];
export type N_10 = [0, 1, 0, 1];
export type N_11 = [1, 1, 0, 1];
export type N_12 = [0, 0, 1, 1];
export type N_13 = [1, 0, 1, 1];
export type N_14 = [0, 1, 1, 1];
export type N_15 = [1, 1, 1, 1];
export type False = N_0;
export type True = N_1;

type MOD_4<
  numerator extends Num,
  divisor extends Num,
  /* variables: */
  result extends any = DIV_4<numerator, divisor>
> = {
  1: result["remainder"];
  0: N_0;
}[result["tag"] extends "result" ? 1 : 0];

type DIV_4<
  numerator extends BITS_4,
  divisor extends BITS_4,
  /* variables: */
  count extends BITS_4 = N_0,
  remainder extends BITS_4 = numerator
> = {
  // remainder < divisor
  1: { tag: "result"; count: count; remainder: remainder };
  // remainder >= divisor
  0: DIV_4<numerator, divisor, ADD_4<count, N_1>, SUB_4<remainder, divisor>>;
}[COMP_4<remainder, divisor>["less"] extends 1 ? 1 : 0];

type MUL_4<
  regA extends BITS_4,
  regB extends BITS_4,
  /* variables: */
  sum0 extends BITS_4 = BITWISE_AND<[regA[0], regA[0], regA[0], regA[0]], regB>,
  sum1 extends BITS_4 = ADD_4<
    [0, AND<regA[1], regB[0]>, AND<regA[1], regB[1]>, AND<regA[1], regB[2]>],
    sum0
  >,
  sum2 extends BITS_4 = ADD_4<
    [0, 0, AND<regA[2], regB[0]>, AND<regA[2], regB[1]>],
    sum1
  >,
  sum3 extends BITS_4 = ADD_4<[0, 0, 0, AND<regA[3], regB[0]>], sum2>
> = sum3;

type SUB_4<
  regA extends BITS_4,
  regB extends BITS_4,
  /* variables: */
  a extends SUBTRACT_RESULT = FULL_SUBTRACTOR<0, regA[0], regB[0]>,
  b extends SUBTRACT_RESULT = FULL_SUBTRACTOR<a["borrow"], regA[1], regB[1]>,
  c extends SUBTRACT_RESULT = FULL_SUBTRACTOR<b["borrow"], regA[2], regB[2]>,
  d extends SUBTRACT_RESULT = FULL_SUBTRACTOR<c["borrow"], regA[3], regB[3]>
> = [a["diff"], b["diff"], c["diff"], d["diff"]];

type ADD_4<
  regA extends BITS_4,
  regB extends BITS_4,
  /* variables: */
  a extends ADDER_RESULT = FULL_ADDER<0, regA[0], regB[0]>,
  b extends ADDER_RESULT = FULL_ADDER<a["carry"], regA[1], regB[1]>,
  c extends ADDER_RESULT = FULL_ADDER<b["carry"], regA[2], regB[2]>,
  d extends ADDER_RESULT = FULL_ADDER<c["carry"], regA[3], regB[3]>
> = [a["sum"], b["sum"], c["sum"], d["sum"]];

type FULL_SUBTRACTOR<
  borrow extends B,
  a extends B,
  b extends B,
  /* variables: */
  subtractor1 extends SUBTRACT_RESULT = HALF_SUBTRACTOR<a, b>,
  subtractor2 extends SUBTRACT_RESULT = HALF_SUBTRACTOR<
    subtractor1["diff"],
    borrow
  >
> = {
  diff: subtractor2["diff"];
  borrow: OR<subtractor1["borrow"], subtractor2["borrow"]>;
};

type FULL_ADDER<
  carry extends B,
  a extends B,
  b extends B,
  /* variables: */
  adder1 extends ADDER_RESULT = HALF_ADDER<a, b>,
  adder2 extends ADDER_RESULT = HALF_ADDER<carry, adder1["sum"]>
> = {
  sum: adder2["sum"];
  carry: OR<adder2["carry"], adder1["carry"]>;
};

type SUBTRACT_RESULT = { diff: B; borrow: B };
type ADDER_RESULT = { sum: B; carry: B };

type HALF_SUBTRACTOR<a extends B, b extends B> = {
  diff: XOR<a, b>;
  borrow: AND<NOT<a>, b>;
};

type HALF_ADDER<a extends B, b extends B> = {
  sum: XOR<a, b>;
  carry: AND<a, b>;
};

type BITWISE_AND<a extends BITS_4, b extends BITS_4> = [
  AND<a[0], b[0]>,
  AND<a[1], b[1]>,
  AND<a[2], b[2]>,
  AND<a[3], b[3]>
];

type COMP_4<
  a extends BITS_4,
  b extends BITS_4,
  /* variables: */
  c0 extends COMP_RESULT = COMP<a[0], b[0]>,
  c1 extends COMP_RESULT = COMP<a[1], b[1]>,
  c2 extends COMP_RESULT = COMP<a[2], b[2]>,
  c3 extends COMP_RESULT = COMP<a[3], b[3]>
> = {
  less: OR_4<
    c3["grt"],
    AND<c3["eq"], c2["grt"]>,
    AND_4<1, c3["eq"], c2["eq"], c1["grt"]>,
    AND_4<c3["eq"], c2["eq"], c1["eq"], c0["grt"]>
  >;
  eq: AND_4<c0["eq"], c1["eq"], c2["eq"], c3["eq"]>;
  grt: OR_4<
    c3["less"],
    AND<c3["eq"], c2["less"]>,
    AND_4<1, c3["eq"], c2["eq"], c1["less"]>,
    AND_4<c3["eq"], c2["eq"], c1["eq"], c0["less"]>
  >;
};

type COMP_RESULT = { less: B; eq: B; grt: B };

type COMP<
  a extends B,
  b extends B,
  /* variables */
  aLessThanB extends B = AND<NOT<b>, a>,
  aGreaterThanB extends B = AND<b, NOT<a>>,
  equal extends B = NOR<aLessThanB, aGreaterThanB>
> = { less: aLessThanB; eq: equal; grt: aGreaterThanB };

type EQ_4<
  a extends BITS_4,
  b extends BITS_4,
  /* variables */
  eq0 extends B = NXOR<a[0], b[0]>,
  eq1 extends B = NXOR<a[1], b[1]>,
  eq2 extends B = NXOR<a[2], b[2]>,
  eq3 extends B = NXOR<a[3], b[3]>,
> = [AND_4<eq0, eq1, eq2, eq3>, 0, 0, 0];

type NXOR<a extends B, b extends B> = {
  1: {
    1: 1;
    0: 0;
  };
  0: {
    1: 0;
    0: 1
  }
}[a][b];

type XOR<a extends B, b extends B> = {
  1: {
    1: 0;
    0: 1;
  };
  0: {
    1: 1;
    0: 0
  }
}[a][b];

type AND_4<a extends B, b extends B, c extends B, d extends B> = AND<
  AND<a, b>,
  AND<c, d>
>;

type AND<a extends B, b extends B> = {
  1: {
    1: 1;
    0: 0;
  };
  0: {
    1: 0;
    0: 0
  }
}[a][b];

type NOR<a extends B, b extends B> = {
  1: {
    1: 0;
    0: 0;
  };
  0: {
    1: 0;
    0: 1;
  }
}[a][b];

type OR_4<a extends B, b extends B, c extends B, d extends B> = OR<
  OR<a, b>,
  OR<c, d>
>;

type OR<a extends B, b extends B> = {
  1: {
    1: 1;
    0: 1;
  };
  0: {
    1: 1;
    0: 0;
  }
}[a][b];

type NOT<a extends B> = {
  1: 0;
  0: 1
}[a];

// Ideally all other gates would be built by composing NANDs,
// however this creates a TypeScript 'possible infinite loop' error
type NAND<a extends B, b extends B> = {
  1: {
    1: 0;
    0: 1;
  };
  0: {
    1: 1;
    0: 1;
  };
}[a][b];

/** Covert 4-bit number to a string for printing */
type N_ToString<n extends Num>
  = n extends N_0 ? "0"
  : n extends N_1 ? "1"
  : n extends N_2 ? "2"
  : n extends N_3 ? "3"
  : n extends N_4 ? "4"
  : n extends N_5 ? "5"
  : n extends N_6 ? "6"
  : n extends N_7 ? "7"
  : n extends N_8 ? "8"
  : n extends N_9 ? "9"
  : n extends N_10 ? "10"
  : n extends N_11 ? "11"
  : n extends N_12 ? "12"
  : n extends N_13 ? "13"
  : n extends N_14 ? "14"
  : n extends N_15 ? "15"
  : "nan";

/** Given a line number return an Instruction_Address  */
export type Line<line extends number, __address extends Instruction_Address = []> = {
  0: Line<line, Prepend<any, __address>>;
  1: Tail<__address>;
}[__address["length"] extends line ? 1 : 0];
