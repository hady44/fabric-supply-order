/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
 /*
  * TODO add checks:
  * 1) don't allow sending for yet to be paid.  ??
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const { RequestStatus } = require('./common');

class Supplier extends Contract {
    // used for debugging and visualisation purposes. Not part of the translation.
    async querySupplyRequest(ctx, itemNumber) {
        const itemsAsBytes = await ctx.stub.getState(itemNumber); // get the supplyRequest from chaincode state
        if (!itemsAsBytes || itemsAsBytes.length === 0) {
            throw new Error(`${itemsAsBytes} does not exist`);
        }
        console.log(itemsAsBytes.toString());
        return itemsAsBytes.toString();
    }

    async checkStock(ctx, itemNumber, requestNumber) {
      console.info('============= START : placeOrder ===========');
          const itemAsBytes = await ctx.stub.getState(itemNumber); // get the item from chaincode state
          const requestAsBytes = await ctx.stub.getState(requestNumber); // get the from chaincode state

          if (!itemAsBytes || itemAsBytes.length === 0 || !requestAsBytes || requestAsBytes.length === 0) {
              throw new Error(`item ${itemNumber} or request ${requestNumber} does not exist`);
          }
          let item = JSON.parse(itemAsBytes.toString());
          let request = JSON.parse(requestAsBytes.toString());

          // checks item is in stock and reply accordingly. TODO: either inform and prepare or reject (set this on diagram)
          // TODO: split to function for 1:1 mapping with the diagram
          if (item.stock < request.amount) {
            item = await this.reject(ctx, requestNumber, request);
          } else {
            const returnValue = await this.approve(ctx, itemNumber, requestNumber, item, request);
            item = returnValue.item;
            request = returnValue.request;
          }
          return { request, item };
          console.info('============= END : placeOrder ===========');
    }

    async reject(ctx, requestNumber, request) {
      request.state = RequestStatus.rejection_sent;
      await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));
      return request;
    }

    async approve(ctx, itemNumber, requestNumber, item, request) {
      item.stock = item.stock - request.amount;
      request.state = RequestStatus.preparing;
      await ctx.stub.putState(itemNumber, Buffer.from(JSON.stringify(item)));
      await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));
      return {item, request}
    }

    // 1:1 mapping with the diagram.
    async dispatchProduct(ctx, itemNumber, requestNumber) {
      console.info('============= START : deliverProduct ===========');
          const requestAsBytes = await ctx.stub.getState(requestNumber); // get the from chaincode state

          if (!requestAsBytes || requestAsBytes.length === 0) {
              throw new Error(`item ${itemNumber} or request ${requestNumber} does not exist`);
          }
          const request = JSON.parse(requestAsBytes.toString());

          request.state = RequestStatus.dispatched;
          await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));

          return request;
          console.info('============= END : deliverProduct ===========');
    }

    // used for debugging and visualisation purposes. Not part of the translation.
    async queryAllItems(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    // async changeCarOwner(ctx, carNumber, newOwner) {
    //     console.info('============= START : changeCarOwner ===========');
    //
    //     const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
    //     if (!carAsBytes || carAsBytes.length === 0) {
    //         throw new Error(`${carNumber} does not exist`);
    //     }
    //     const car = JSON.parse(carAsBytes.toString());
    //     car.owner = newOwner;
    //
    //     await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
    //     console.info('============= END : changeCarOwner ===========');
    // }

}

module.exports = Supplier;
