const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const app = express();
const port = 6969;

const rootDirectory = "./views";

mongoose.connect(
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.3"
);

const folderSchema = new mongoose.Schema({
  name: String,
  path: String,
  url: String,
  views: Number,
});

const Folder = mongoose.model("videoViews", folderSchema);

const addFoldersToDatabase = async (rootDirectory) => {
  const existingFolders = await Folder.find();
  const newFolders = [];
  const readDirectory = (directory) => {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        const folder = {
          name: file,
          path: "/" + path.relative(rootDirectory, filePath),
          url: ``,
          views: 0,
        };
        const existingFolder = existingFolders.find(
          (f) => f.name === folder.name && f.path === folder.path
        );
        if (!existingFolder) {
          newFolders.push(folder);
        }
        readDirectory(filePath);
      }
    }
  };
  readDirectory(rootDirectory);
  for (const folder of newFolders) {
    await Folder.create(folder);
  }
};

const addUrlToDb = async (name, url) => {
  const updatedFolder = await Folder.findOneAndUpdate(
    { name },
    { url },
    { new: true }
  );

  if (!updatedFolder) {
    const folder = new Folder({ name, url });
    return folder.save();
  } else {
    return updatedFolder;
  }
};

app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/resetViews", async (req, res) => {
  const folders = await Folder.find({});
  for (let folder of folders) {
    folder.views = 0;
    await folder.save();
  }
  res.status(200).send("All view counts reset to 0");
});

app.get("/sync", async (req, res, next) => {
  await addFoldersToDatabase(path.join(__dirname, rootDirectory));
  const folders = await Folder.find();
  const data = [{ name: "Sync" }];
  const folder = { folders: [] };
  const subfolder = null;
  const url = "";
  res.render("layout", { folders, data, folder, subfolder, url });
});

app.get("/submit", async (req, res, next) => {
  const folders = await Folder.find();
  var data = {
    name: "Submit",
    path: "/submit",
  };
  res.render("form", {
    folders,
    folder: { folders: [] },
    data: data,
    subfolder: null,
  });
});

app.post("/submit", (req, res) => {
  const { name, url } = req.body;
  addUrlToDb(name, url)
    .then(() => {
      res.redirect("/submit");
    })
    .catch((err) => {
      res.status(500).send("Error saving data to the database");
    });
});

app.post("/incrementView/:folderName", async (req, res) => {
  const { folderName } = req.params;
  const folder = await Folder.findOne({ name: folderName });
  if (!folder) {
    return res.status(404).send("Folder not found");
  }
  folder.views += 1;
  await folder.save();
  res.status(200).send(`View count incremented for ${folderName}`);
});

app.get("/:folderName/:subfolderName?", async (req, res) => {
  const { folderName, subfolderName } = req.params;
  const folderPath = path.join(rootDirectory, folderName, subfolderName || "");
  
  // Check if the folder exists in the file system
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return res.status(404).send("Folder not found in the file system");
  }
  
  let folder = await Folder.findOne({ name: folderName });
  
  // If the folder is not in the database, add it
  if (!folder) {
    folder = new Folder({ name: folderName, path: folderPath, views: 0 });
    await folder.save();
  }
  
  const subfolder = await Folder.findOne({ name: subfolderName });
  const folders = await Folder.find();
  const data = folders.map((folder) => ({
    name: folder.name,
    url: folder.url,
    subfolders: folder.subfolders || [],
  }));
  let url = null;
  if (subfolder && subfolder.url) {
    url = subfolder.url;
  } else if (folder && folder.url) {
    url = folder.url;
  }
  res.render("layout", {
    folder,
    subfolder,
    folders,
    data: [data],
    url: url,
    views: folder.views,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});