const express = require("express");
const cors = require("cors");
require("./db/config");
const app = express();
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require("jsonwebtoken");
const JwtKey = "e-comm";

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  resp.send(result);
});

app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, JwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send({ result: err });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({ result: "no User exist" });
    }
  } else {
    resp.send({ result: "no User exist" });
  }
});

app.post("/add-Product", verifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

app.get("/product", verifyToken, async (req, resp) => {
  let data = await Product.find();
  if (data.length > 0) {
    resp.send(data);
  } else {
    resp.send({ result: "No record" });
  }
});

app.get("/product/:id", verifyToken, async (req, resp) => {
  let data = await Product.find({ _id: req.params.id });
  resp.send(data);
});

app.put("/product/:id", verifyToken, async (req, resp) => {
  let data = await Product.updateOne(
    {
      _id: req.params.id,
    },
    {
      $set: req.body,
    }
  );
  resp.send(data);
});

app.delete("/product/:id", verifyToken, async (req, resp) => {
  const result = await Product.deleteMany({ _id: req.params.id });
  resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result);
});

function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];

  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, JwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please add token with header" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "Please add token with header" });
  }
  // next();
}

app.listen(8000);
