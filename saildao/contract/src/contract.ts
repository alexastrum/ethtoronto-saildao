import { NearBindgen, NearContract, near, call, view } from "near-sdk-js";

// The @NearBindgen decorator allows this code to compile to Base64.
@NearBindgen
class MyContract extends NearContract {
  proposalCreationCost: string;
  bookingCost: string;
  bookings: { [dateTime: string]: string }; // '2022-08-10T21' => 'alex.near'
  owner: string;

  constructor({
    proposalCreationCost = "100000000000000000000000", // 0.1Ⓝ
    bookingCost = "1000000000000000000000000", // 1Ⓝ
    owner = "sail-dao.sputnikv2.testnet", // near.predecessorAccountId()
  }: {
    owner?: string;
    bookingCost?: string;
    proposalCreationCost?: string;
  }) {
    //execute the NEAR Contract's constructor
    super();
    this.proposalCreationCost = proposalCreationCost;
    this.bookingCost = bookingCost;
    this.bookings = {};
    this.owner = owner;
  }

  default() {
    return new MyContract({});
  }

  // @call indicates that this is a 'change method' or a function
  // that changes state on the blockchain. Change methods cost gas.
  // For more info -> https://docs.near.org/docs/concepts/gas
  @call
  book({
    year,
    month,
    day,
    hour,
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
  }): void {
    if (near.attachedDeposit().toString() !== this.bookingCost) {
      throw new Error(
        `Invalid deposit ${near.attachedDeposit()} !== ${this.bookingCost}`
      );
    }

    const who = near.predecessorAccountId();
    const dateTime = `${year}-${month}-${day}T${hour}`;

    if (this.bookings.hasOwnProperty(dateTime)) {
      throw new Error(
        `Boat already booked for ${dateTime} by ${this.bookings[dateTime]}`
      );
    }

    this.bookings[dateTime] = who;
    near.log(`${who} booked boat owned by ${this.owner} for ${dateTime}`);

    // near.promiseBatchActionTransfer(
    //   near.promiseBatchCreate(this.owner),
    //   near.attachedDeposit()
    // );

    const batchId = near.promiseBatchCreate(this.owner);
    const proposalCost = BigInt(this.proposalCreationCost);

    near.promiseBatchActionTransfer(
      batchId,
      (near.attachedDeposit() as bigint) - proposalCost
    );

    near.promiseBatchActionFunctionCall(
      batchId,
      "add_proposal",
      `{
        proposal: {
          description: "Automated proposal$$$$$$$$ProposeAddMember",
          kind: {
            AddMemberToRole: {
              member_id: "${who}",
              role: "members",
            },
          },
        },
      }`,
      proposalCost,
      0 //near.prepaidGas() / 10
    );

    near.promiseBatchActionFunctionCall(
      batchId,
      "act_proposal",
      `{
        "id": 0,
        "action": "VoteApprove"
      }`,
      0,
      0 //near.prepaidGas() / 10
    );
  }

  // @view indicates a 'view method' or a function that returns
  // the current values stored on the blockchain. View calls are free
  // and do not cost gas.
  @view
  get_booking_cost(): string {
    return this.bookingCost.toString();
  }

  // @view indicates a 'view method' or a function that returns
  // the current values stored on the blockchain. View calls are free
  // and do not cost gas.
  @view
  get_booking({
    year,
    month,
    day,
    hour,
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
  }): string {
    const dateTime = `${year}-${month}-${day}T${hour}`;
    const who = this.bookings[dateTime];
    near.log(
      who
        ? `Boat booked for ${dateTime} by ${who}`
        : `Boat available for ${dateTime}`
    );
    return who;
  }
}
