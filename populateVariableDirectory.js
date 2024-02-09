import displayNames from "./constants.js";

const dialog = document.querySelector(".dialog-content");
const name = document.createElement("div");
name.textContent = "Name";
const categorical = document.createElement("div");
categorical.textContent = "Categorical";
const unit = document.createElement("div");
unit.textContent = "Unit";
const type = document.createElement("div");
type.textContent = "Type";
dialog.append(name, categorical, unit, type);

for (let value of Object.keys(displayNames)) {
  const currentValue = displayNames[value];
  const nameValue = document.createElement("div");
  nameValue.textContent = currentValue["displayName"];
  const categoricalValue = document.createElement("div");
  categoricalValue.textContent = currentValue["isCategorical"] ? "Yes" : "No";
  const unitValue = document.createElement("div");
  unitValue.textContent = currentValue["unit"]
    .split("")
    .filter((char) => char !== "(" && char !== ")")
    .join("");
  const typeValue = document.createElement("div");
  typeValue.textContent = currentValue["type"];
  dialog.append(nameValue, categoricalValue, unitValue, typeValue);
}
