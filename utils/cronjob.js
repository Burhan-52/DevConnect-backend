import cron from "node-cron";
import connectionRequest from "../src/models/connectionRequest.js";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { run } from "./sendEmail.js";

cron.schedule("0 9 * * *", async () => {
  try {
    const yesterday = subDays(new Date(), 0);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequest = await connectionRequest
      .find({
        status: "interested",
        createdAt: {
          $gte: yesterdayStart,
          $lt: yesterdayEnd,
        },
      })
      .populate("fromUserId toUserId");

    console.log(pendingRequest);

    const listOfEmails = [
      ...new Set(pendingRequest.map((req) => req.toUserId.email)),
    ];

    for (let email of listOfEmails) {
      await run(email, "I want to connect", pendingRequest.firstName);
    }
  } catch (error) {
    console.log("error in cron job" + error);
  }
});
