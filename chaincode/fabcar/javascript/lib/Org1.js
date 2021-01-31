/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

 // TODO: move object retreive / update logic to a reusable, modular helper.
/*
 * TODO add checks:
 * 1) don't allow paying for un approved1)
 - discuss different gateways,
 - discuss channels.
 - limitations of the 1 tp 1 mapping.
 - conversion to uml + limitations
 -
*/
'use strict';

const { Contract } = require('fabric-contract-api');
const { RequestStatus } = require('./common');
class Org1 extends Contract {
    // TODO: move to index.js ?
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const supplyRequests = [
            {
                state: undefined,
                paid: false,
                itemId: 'ITEM1',
                amount: 0,
                isInBudget: true,
            },
        ];

        for (let i = 0; i < supplyRequests.length; i++) {
            supplyRequests[i].docType = 'request';
            await ctx.stub.putState('REQ' + i, Buffer.from(JSON.stringify(supplyRequests[i])));
            console.info('Added <--> ', supplyRequests[i]);
        }
        console.info('============= END : Initialize Ledger ===========');

        console.info('============= START : Initialize Ledger ===========');
        const items = [
            {
                type: 'chair',
                stock: 5,
            },
            {
                type: 'tables',
                stock: 3,
            },
        ];

        for (let i = 0; i < items.length; i++) {
            items[i].docType = 'item';
            await ctx.stub.putState('ITEM' + i, Buffer.from(JSON.stringify(items[i])));
            console.info('Added <--> ', items[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    // used for debugging and visualisation purposes. Not part of the translation.
    async querySupplyRequest(ctx, supplyRequestsNumber) {
        const supplyRequestsAsBytes = await ctx.stub.getState(supplyRequestsNumber); // get the supplyRequest from chaincode state
        if (!supplyRequestsAsBytes || supplyRequestsAsBytes.length === 0) {
            throw new Error(`${supplyRequestsAsBytes} does not exist`);
        }
        console.log(supplyRequestsAsBytes.toString());
        return supplyRequestsAsBytes.toString();
    }

    // 1:1 mapping with diagram.
    async submitRequest(ctx, supplyRequestNumber, itemId, amount, isInBudget) {
        console.info('============= START : Submit SupplyRequest ===========');

        // The gateway check is represented by an if condition in this case.
        if (!isInBudget || isInBudget === 'false') {
          // 1:1 mapping with diagram
          await this.noFurtherProcess(ctx, supplyRequestNumber, itemId, amount, isInBudget);
        } else {
          // 1:1 mapping with diagram
          await this.sendEquipmentListToSupplier(ctx, supplyRequestNumber, itemId, amount, isInBudget)
        }
        console.info('============= END : Submit SupplyRequest ===========');
    }

    // 1:1 mapping with diagram
    async noFurtherProcess(ctx, supplyRequestNumber, itemId, amount, isInBudget) {
      // end state
      this.createRequest(ctx, supplyRequestNumber, RequestStatus.rejected, false, itemId, amount, isInBudget);
    }

    // 1:1 mapping with diagram
    async sendEquipmentListToSupplier(ctx, supplyRequestNumber, itemId, amount, isInBudget) {
      // sets a start state (setting a status of "sent" represents this) for org2 (supplier).
      this.createRequest(ctx, supplyRequestNumber, RequestStatus.sent, false, itemId, amount, isInBudget);
    }

    async processResponse(ctx, requestNumber) {
          console.info('============= START : processResponse ===========');
          const requestAsBytes = await ctx.stub.getState(requestNumber); // get the from chaincode state

          if (!requestAsBytes || requestAsBytes.length === 0) {
              throw new Error(`request ${requestNumber} does not exist`);
          }
          let request = JSON.parse(requestAsBytes.toString());
          // simulates the exclusive gateway.
          if (request.state === RequestStatus.rejection_sent) {
            request.state = RequestStatus.rejected;
            await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));
          } else {
            request = await this.payBill(ctx, requestNumber);
          }

          return request;
          console.info('============= END : processResponse ===========');
    }

    // A helper function that creates request objects.
    async createRequest(ctx, supplyRequestNumber, state, paid, itemId, amount, isInBudget) {
        console.info('============= START : Create SupplyRequest ===========');

        const supplyRequest = {
            state,
            docType: 'request',
            paid,
            itemId,
            amount,
            isInBudget
        };

        await ctx.stub.putState(supplyRequestNumber, Buffer.from(JSON.stringify(supplyRequest)));
        console.info('============= END : Create SupplyRequest ===========');
    }

    // used for debugging and visualisation purposes. Not part of the translation.
    async queryAllRequests(ctx) {
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
    // 1:1 mapping with diagram.
    async payBill(ctx, requestNumber) {
      console.info('============= START : payBill ===========');
          const requestAsBytes = await ctx.stub.getState(requestNumber); // get the from chaincode state

          if (!requestAsBytes || requestAsBytes.length === 0) {
              throw new Error(`request ${requestNumber} does not exist`);
          }
          const request = JSON.parse(requestAsBytes.toString());
          // simulates changing the abstract state.
          request.paid = true;
          await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));

          return request;
          console.info('============= END : payBill ===========');
    }

    async equipmentReceived(ctx, requestNumber) {
      console.info('============= START : payBill ===========');
          const requestAsBytes = await ctx.stub.getState(requestNumber); // get the from chaincode state

          if (!requestAsBytes || requestAsBytes.length === 0) {
              throw new Error(`request ${requestNumber} does not exist`);
          }
          const request = JSON.parse(requestAsBytes.toString());
          // simulates changing the abstract state.
          request.state = RequestStatus.received;
          await ctx.stub.putState(requestNumber, Buffer.from(JSON.stringify(request)));

          return request;
          console.info('============= END : payBill ===========');
    }

    async getAllResults(ctx, requestNumber){
        const requests = await ctx.stub.getHistoryForKey(requestNumber);
        const iterator = requests;
        const isHistory = true;
        let allResults = [];
        while (true) {
          let res = await iterator.next();

          if (res.value && res.value.value && res.value.value.toString()) {
            let jsonRes = {};
            console.log(res.value.value.toString('utf8'));

            if (isHistory && isHistory === true) {
              jsonRes.TxId = res.value.tx_id;
              jsonRes.Timestamp = res.value.timestamp;
              // jsonRes.IsDelete = res.value.is_delete.toString();
              try {
                jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Value = res.value.value.toString('utf8');
              }
            } else {
              jsonRes.Key = res.value.key;
              try {
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Record = res.value.value.toString('utf8');
              }
            }
            allResults.push(jsonRes);
          }
          if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return allResults;
          }
        }
      }
}

module.exports = Org1;
