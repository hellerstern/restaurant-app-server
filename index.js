require("./server/config/config");
const mongoose = require("mongoose");
const server = require("./server/server");

// Connecting with the database
mongoose.connect(process.env.URLDB, { useNewUrlParser: true }, (err, res) => {
  if (err) throw err;
  console.log("Data base ONLINE");
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
