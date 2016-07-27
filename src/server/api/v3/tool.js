'use strict';
var file = require('./file');
var find = file.find;
var _ = require('lodash');

/****************************** Helper Functions ******************************/

function getWorkstepsForTool(exe, toolId) {
  if (find.IsWorkingstep(exe)) {
    if (find.GetWorkingstepTool(exe) === toolId) {
      return [exe];
    } else {
      return [];
    }
  } else if (find.IsWorkplan(exe) || find.IsSelective(exe)) {
    let rtn = [];
    let children = find.GetNestedExecutableAll(exe);
    if (children !== undefined) {
      _.each(children, (childId) => {
        rtn = rtn.concat(getWorkstepsForTool(childId, toolId));
      });
    }
    return rtn;
  } else {
    return [];
  }
};

/***************************** Endpoint Functions *****************************/

function _getTools(req, res) {
  let toolList = find.GetToolAll();
  let rtn = [];
  for (let id of toolList) {
    let name = find.GetToolPartName(id).replace(/_/g, ' ');
    let toolType = find.GetToolType(id);
    let workingsteps = getWorkstepsForTool(find.GetMainWorkplan(), id);
    let enable = false;
    let d = find.GetToolDiameter(id);
    let dUnit = find.GetToolDiameterUnit(id);
    let rad = find.GetToolCornerRadius(id);
    let radUnit = find.GetToolCornerRadiusUnit(id);
    let length = find.GetToolLength(id);
    let lengthUnit = find.GetToolLengthUnit(id);
    for (let ws of workingsteps) {
      if (find.IsEnabled(ws)) {
        enable = true;
      }
    }
    rtn.push({
      'id' : id,
      'name': name,
      'type': 'tool',
      'toolType': toolType,
      'workingsteps': workingsteps,
      'enabled' : enable,
      'diameter' : d,
      'diameterUnit' : dUnit,
      'cornerRadius' : rad,
      'cornerRadiusUnit': radUnit,
      'length' : length,
      'lengthUnit' : lengthUnit,
    });
  }
  res.status(200).send(rtn);
};

function _getWsTool(req, res) {
  if (req.params.wsId) {
    let wsId = req.params.wsId;
    let rtn = find.GetWorkingstepTool(Number(wsId));
    res.status(200).send(String(rtn));
  }
}

function _getToolEnabled(req, res) {
  let ret = false;
  let toolID = req.params.toolId;
  let mainWp = find.GetMainWorkplan();
  let workingsteps = getWorkstepsForTool(mainWp, parseInt(toolID));
  for (let ws in workingsteps) {
    if (find.IsEnabled(workingsteps[ws])) {
      ret = true;
    }
  }
  res.status(200).send(ret);
}

module.exports = function(app, cb) {
  app.router.get('/v3/nc/tools', _getTools);
  app.router.get('/v3/nc/tools/:wsId', _getWsTool);
  app.router.get('/v3/nc/tool/:toolId', _getToolEnabled);

  if (cb) {
    cb();
  }
};
