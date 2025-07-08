import express from "express";
import cookieParser from "cookie-parser";
import path, { resolve, join } from "path";
import { errorHandler } from "./app/middelware/errorhandler.middleware";
import envConfig from "./app/config/env.config";
import { connectDB } from "./app/config/db.connection";
import basicRouter from "./app/routes/basic.route";
import adminRouter from "./app/routes/admin.route";
import callerRouter from "./app/routes/caller.route";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import flash from "connect-flash";
import session from "express-session";


const app = express();

//a basic setup that should be done almost always

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());
// Get information from html forms
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 2000,
  })
);
app.use(express.static(resolve(join(__dirname, "public"))));
app.use(express.static("./public"));
app.use(express.static("uploads"));
app.use("/uploads", express.static(__dirname + "uploads"));
app.set("view engine", "ejs");
app.set("views", "views");
app.set("views", path.join(__dirname, "views"));
app.use(cors());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.delete_msg = req.flash("delete_msg");
  next();
});
//Define your routes here ,

app.use("/any-prefix", basicRouter);
app.use("/admin", adminRouter);
app.use("/caller", callerRouter);

//this is the global erro handler middleware , it should always be at the buttom of all rotes
app.use(errorHandler);

//Statrt the server
const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    app.listen(envConfig.PORT, () => {
      console.log(`✅ Server running on http://localhost:${envConfig.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err);
    process.exit(1); // Exit if DB fails
  }
};

startServer();
