/*
SPDX-License-Identifier: Apache-2.0
*/

package org.example;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.hyperledger.fabric.gateway.Contract;
import org.hyperledger.fabric.gateway.Gateway;
import org.hyperledger.fabric.gateway.Network;
import org.hyperledger.fabric.gateway.Wallet;
import org.hyperledger.fabric.gateway.Wallets;

public class ClientApp {

    static {
        System.setProperty("org.hyperledger.fabric.sdk.service_discovery.as_localhost", "true");
    }

    public static void main(String[] args) throws Exception {
        // Load a file system based wallet for managing identities.
        Path walletPath = Paths.get("wallet");
        Wallet wallet = Wallets.newFileSystemWallet(walletPath);
        // load a CCP
        Path networkConfigPath = Paths.get("..", "..", "test-network", "organizations", "peerOrganizations", "org1.example.com", "connection-org1.yaml");

        Gateway.Builder customerBuilder = Gateway.createBuilder();
        customerBuilder.identity(wallet, "org1User").networkConfig(networkConfigPath).discovery(true);

        Gateway.Builder supplierBuilder = Gateway.createBuilder();
        supplierBuilder.identity(wallet, "supplierUser").networkConfig(networkConfigPath).discovery(true);

        // create a gateway connection
        Gateway customerGateway = customerBuilder.connect();
        Gateway supplierGateway = customerBuilder.connect();

        // get the network and contract
        Network customerNetwork = customerGateway.getNetwork("mychannel");
        Contract customerContract = customerNetwork.getContract("fabcar", "Org1");

        // create a gateway connection

        // get the network and contract
        Network supplierNetwork = supplierGateway.getNetwork("mychannel");
        Contract supplierContract = supplierNetwork.getContract("fabcar", "Supplier");

        byte[] result;

        // initialize resources on the chain.
//			supplierContract.evaluateTransaction("initResourcesLedger");

//			// customer creates and sends the order. (send equipment list to supplier). TODO: add checks for gateway X
//			customerContract.submitTransaction("createRequest", "REQ2", "pending", "false", "ITEM0", "1");
////
//			// print all info on the chain.
//			result = customerContract.evaluateTransaction("queryAllRequests");
//			System.out.println(new String(result));
//
//			// print all info on the chain again.
//			result = supplierContract.evaluateTransaction("queryAllItems");
//			System.out.println(new String(result));
//
//			// supplier handles order. (supplier receives order) + inform and prepare TODO: handle rejection in bpmn
//			supplierContract.submitTransaction("placeOrder", "ITEM1", "REQ2");
//
//			// print  all info on the chain.
//			result = customerContract.evaluateTransaction("queryAllRequests");
//			System.out.println(new String(result));
//
//			contract.submitTransaction("changeCarOwner", "CAR10", "Archie");
//
//			result = contract.evaluateTransaction("queryCar", "CAR10");
//			System.out.println(new String(result));

        // initialize (already happens upon infrastructure startup).
        // customer submits an order that is out of budget and should be rejected.
        customerContract.submitTransaction("submitRequest", "REQ4", "ITEM1", "2", "false");
        // print state
        result = customerContract.evaluateTransaction("queryAllRequests");
        System.out.println(new String(result));
        // customer submits an order that is within budget and in stock and should be sent.
        customerContract.submitTransaction("submitRequest", "REQ2", "ITEM1", "2", "true");
        // customer submits an order that is within budget and out of stock and should be sent.
        customerContract.submitTransaction("submitRequest", "REQ3", "ITEM1", "7", "true");
        // print state
        result = customerContract.evaluateTransaction("queryAllRequests");
        System.out.println(new String(result));
        // supplier processes request / checks stock for request out of stock.
        supplierContract.submitTransaction("checkStock", "ITEM1", "REQ3");
        // supplier processes request / checks stock for request within stock.
        supplierContract.submitTransaction("checkStock", "ITEM1", "REQ2");
        // print state.
        result = customerContract.evaluateTransaction("queryAllRequests");
        System.out.println(new String(result));
        // customer pays bill for approved request (the order being prepared).
        customerContract.submitTransaction("processResponse", "REQ2");
//			try paying for non confirmed req.
//			customerContract.submitTransaction("payBill", "REQ2");
        // supplier dispatches (end state).
        supplierContract.submitTransaction("dispatchProduct", "ITEM1", "REQ2");
        // customer receives (end state).
        customerContract.submitTransaction("equipmentReceived", "REQ2");
        result = customerContract.evaluateTransaction("queryAllRequests");
        System.out.println(new String(result));
        result = customerContract.evaluateTransaction("getAllResults", "REQ2");
        System.out.println(new String(result));
    }

}
