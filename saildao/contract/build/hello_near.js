function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }

  return desc;
}

function call(target, key, descriptor) {}
function view(target, key, descriptor) {}
function NearBindgen(target) {
  return class extends target {
    static _init() {
      // @ts-ignore
      let args = target.deserializeArgs();
      let ret = new target(args); // @ts-ignore

      ret.init(); // @ts-ignore

      ret.serialize();
      return ret;
    }

    static _get() {
      let ret = Object.create(target.prototype);
      return ret;
    }

  };
}

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
function log(...params) {
  env.log(`${params.map(x => x === undefined ? 'undefined' : x) // Stringify undefined
  .map(x => typeof x === 'object' ? JSON.stringify(x) : x) // Convert Objects to strings
  .join(' ')}` // Convert to string
  );
}
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
function attachedDeposit() {
  return env.attached_deposit();
}
function prepaidGas() {
  return env.prepaid_gas();
}
function storageRead(key) {
  let ret = env.storage_read(key, 0);

  if (ret === 1n) {
    return env.read_register(0);
  } else {
    return null;
  }
}
function input() {
  env.input(0);
  return env.read_register(0);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
var PromiseResult;

(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
function storageWrite(key, value) {
  let exist = env.storage_write(key, value, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}

class NearContract {
  deserialize() {
    const rawState = storageRead("STATE");

    if (rawState) {
      const state = JSON.parse(rawState); // reconstruction of the contract class object from plain object

      let c = this.default();
      Object.assign(this, state);

      for (const item in c) {
        if (c[item].constructor?.deserialize !== undefined) {
          this[item] = c[item].constructor.deserialize(this[item]);
        }
      }
    } else {
      throw new Error("Contract state is empty");
    }
  }

  serialize() {
    storageWrite("STATE", JSON.stringify(this));
  }

  static deserializeArgs() {
    let args = input();
    return JSON.parse(args || "{}");
  }

  static serializeReturn(ret) {
    return JSON.stringify(ret);
  }

  init() {}

}

var _class, _class2;

// The @NearBindgen decorator allows this code to compile to Base64.
let MyContract = NearBindgen(_class = (_class2 = class MyContract extends NearContract {
  // '2022-08-10T21' => 'alex.near'
  constructor({
    bookingCost = "1000000000000000000000000",
    // 1Ⓝ
    owner = "sail.sputnikv2.testnet" // near.predecessorAccountId()

  }) {
    //execute the NEAR Contract's constructor
    super();
    this.bookingCost = bookingCost;
    this.bookings = {};
    this.owner = owner;
  }

  default() {
    return new MyContract({});
  } // @call indicates that this is a 'change method' or a function
  // that changes state on the blockchain. Change methods cost gas.
  // For more info -> https://docs.near.org/docs/concepts/gas


  book({
    year,
    month,
    day,
    hour
  }) {
    if (attachedDeposit().toString() !== this.bookingCost) {
      throw new Error(`Invalid deposit ${attachedDeposit()} !== ${this.bookingCost}`);
    }

    const who = predecessorAccountId();
    const dateTime = `${year}-${month}-${day}T${hour}`;

    if (this.bookings.hasOwnProperty(dateTime)) {
      throw new Error(`Boat already booked for ${dateTime} by ${this.bookings[dateTime]}`);
    }

    this.bookings[dateTime] = who;
    log(`${who} booked boat owned by ${this.owner} for ${dateTime}`);
    const batchId = promiseBatchCreate(this.owner); // near.promiseBatchActionTransfer(batchId, near.attachedDeposit());

    promiseBatchActionFunctionCall(batchId, "add_proposal", `{
        proposal: {
          description: "Automated proposal$$$$$$$$ProposeAddMember",
          kind: {
            AddMemberToRole: {
              member_id: "${who}",
              role: "members",
            },
          },
        },
      }`, attachedDeposit(), prepaidGas()); // near.promiseBatchActionFunctionCall(
    //   batchId,
    //   "act_proposal",
    //   `{
    //     "id": 0,
    //     "action": "VoteApprove"
    //   }`,
    //   0,
    //   near.prepaidGas()
    // );
  } // @view indicates a 'view method' or a function that returns
  // the current values stored on the blockchain. View calls are free
  // and do not cost gas.


  get_booking_cost() {
    return this.bookingCost.toString();
  } // @view indicates a 'view method' or a function that returns
  // the current values stored on the blockchain. View calls are free
  // and do not cost gas.


  get_booking({
    year,
    month,
    day,
    hour
  }) {
    const dateTime = `${year}-${month}-${day}T${hour}`;
    const who = this.bookings[dateTime];
    log(who ? `Boat booked for ${dateTime} by ${who}` : `Boat available for ${dateTime}`);
    return who;
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "book", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "book"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_booking_cost", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_booking_cost"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_booking", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_booking"), _class2.prototype)), _class2)) || _class;

function init() {
  MyContract._init();
}
function get_booking() {
  let _contract = MyContract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_booking(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_booking_cost() {
  let _contract = MyContract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_booking_cost(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function book() {
  let _contract = MyContract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.book(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}

export { book, get_booking, get_booking_cost, init };
//# sourceMappingURL=hello_near.js.map
