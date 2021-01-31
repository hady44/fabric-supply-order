/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const Org1 = require('./lib/Org1');
const Supplier = require('./lib/Supplier');

module.exports.Org1 = Org1;
module.exports.Supplier = Supplier;

module.exports.contracts = [ Org1, Supplier ];
