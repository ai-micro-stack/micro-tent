require("module-alias/register");
const fs = require("fs");
const path = require("path");

// const stack = "plat";
// const moduleTypes = ["embedding", "vectordb", "llm"];
// const moduleDatabase = path.join(__dirname, "../modules/plat", `module.mdb`);

function ScanStackModules(stack, moduleTypes, moduleDatabase) {
  let moduleLists = {};

  // populate 1st item of each type
  for (const idx in moduleTypes) {
    const area = moduleTypes[idx] + "Modules";
    moduleLists[area] = new Array();
    moduleLists[area].push({
      moduleName: "(None)",
      moduleRoles: [{ id: 0, role: "(None)" }],
      moduleStatus: 0,
      compatibility: null,
    });
  }
  // console.log(JSON.stringify(moduleLists, null, 4));

  // const moduleDatabase = path.join(__dirname, "../modules/plat", `module.mdb`);
  try {
    const data = fs.readFileSync(moduleDatabase, "utf-8");
    const jsonData = JSON.parse(data);
    const moduleData = Object.keys(jsonData);
    moduleData.forEach((moduleArea) => {
      for (i = 1; i < jsonData[moduleArea].length; i++) {
        moduleLists[moduleArea].push(jsonData[moduleArea][i]);
      }
    });
  } catch (err) {
    console.error("Read module config data file failed, will regenerate it.");
  }

  for (let i = 0; i < moduleTypes.length; i++) {
    const moduleType = moduleTypes[i];
    const moduleArea = `${moduleType}Modules`;
    const modulePath = path.join(
      __dirname,
      `../modules/${stack}`,
      `${moduleType}`
    );
    const folderList = fs
      .readdirSync(modulePath, { withFileTypes: true })
      .filter((t) => {
        return t.isDirectory && t.name !== "config";
      })
      .map((t) => {
        return t.name.toString();
      });

    // console.log(moduleArea);
    for (j = 1; j < moduleLists[moduleArea].length; j++) {
      if (!folderList.includes(moduleLists[moduleArea][j].moduleName)) {
        // moduleLists[moduleArea][j].moduleName =
        //   moduleLists[moduleArea][j].moduleName.split("(")[0] + `(deprecated)`;
        moduleLists[moduleArea][j].moduleStatus = -1;
      } else if (moduleLists[moduleArea][j].moduleStatus === -1) {
        moduleLists[moduleArea][j].moduleStatus = 1;
      }
    }
    folderList.forEach((m) => {
      const module = moduleLists[moduleArea].filter((m) => m.moduleName);
      if (!moduleLists[moduleArea].map((m) => m.moduleName).includes(m)) {
        const rolesPath = path.join(modulePath, m, `roles.json`);
        let rolesData = "";
        let rolesJson = {};
        let roles = [];
        try {
          rolesData = fs.readFileSync(rolesPath, "utf-8");
          rolesJson = JSON.parse(rolesData.replace(/\r\n/g, ""));
          roles = rolesJson.roles ?? [];
        } catch {}

        moduleLists[moduleArea].push({
          moduleName: m,
          moduleRoles: roles.length
            ? roles
            : [
                {
                  id: 0,
                  role: "(None)",
                },
              ],
          moduleStatus: roles.length ? 1 : 0,
          compatibility: rolesJson.compatibility ?? null,
        });
      } else {
        // #### need to debug this section, why not updating the roles ###
        const rolesPath = path.join(modulePath, m, `roles.json`);
        let rolesData = "";
        let rolesJson = "";
        let roles = "";
        try {
          rolesData = fs.readFileSync(rolesPath, "utf-8");
          rolesJson = JSON.parse(rolesData.replace(/\r\n/g, ""));
          roles = rolesJson.roles ?? "";
        } catch {}

        module[0].moduleRoles = [...roles];
      }
    });
  }
  fs.writeFileSync(moduleDatabase, JSON.stringify(moduleLists, null, 4));
  return moduleLists;
}

function StackModules(stack, moduleTypes, moduleDatabase) {
  let j = 0;
  let k = 0;
  let moduleLists = {};
  let data = null;
  let jsonData = null;
  let moduleData = null;

  do {
    // populate 1st item of each type
    for (const idx in moduleTypes) {
      const area = moduleTypes[idx] + "Modules";
      moduleLists[area] = new Array();
      moduleLists[area].push({
        moduleName: "(None)",
        moduleRoles: [{ id: 0, role: "(None)" }],
        moduleStatus: 0,
        compatibility: null,
      });
    }
    // console.log(JSON.stringify(moduleLists, null, 4));

    try {
      data = fs.readFileSync(moduleDatabase, "utf-8");
      jsonData = JSON.parse(data);
      moduleData = Object.keys(jsonData);
      moduleData.forEach((moduleArea) => {
        for (i = 1; i < jsonData[moduleArea].length; i++) {
          moduleLists[moduleArea].push(jsonData[moduleArea][i]);
        }
      });
      k++;
    } catch (err) {
      console.error(
        "Read module config data file failed, need a resource scan."
      );
      ScanStackModules(stack, moduleTypes, moduleDatabase);
      k = 0;
    }
    j++;
  } while (k < 1 && j < 2);

  return moduleLists;
}

module.exports = { ScanStackModules, StackModules };
