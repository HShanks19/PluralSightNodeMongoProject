const MongoClient = require('mongodb').MongoClient;
const assert = require ('assert');

const circulationRepo = require('./repos/circulationRepo');
const data = require('./circulation.json');

const url = 'mongodb://localhost:27017';
const dbName = 'circulation';

async function main(){
    const client = new MongoClient(url);
    await client.connect();

    try {
        const results = await circulationRepo.loadData(data);
        assert.strictEqual(data.length, results.insertedCount);

        //get Data
        const getData = await circulationRepo.get();
        assert.strictEqual(data.length, getData.length);

        //filter data
        const filterData = await circulationRepo.get({Newspaper: getData[4].Newspaper});
        console.log(filterData);
        assert.deepStrictEqual(filterData[0], getData[4]);

        //limit data
        const limitData = await circulationRepo.get({}, 3);
        assert.strictEqual(limitData.length, 3);

        // get by id
        const id = getData[4]._id.toString();
        const byId = await circulationRepo.getById(getData[4]._id);
        console.log(byId);
        assert.deepStrictEqual(byId, getData[4]);

        //add new item
        const newItem = {
            "Newspaper": "My Paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 2,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        }
        const addedItem = await circulationRepo.add(newItem);
        // will only have an id if it has been added
        assert(addedItem._id);
        const addedItemQuery = await circulationRepo.getById(addedItem._id);
        assert.deepStrictEqual(addedItemQuery, newItem);

        //update Item
        const updatedItem = await circulationRepo.update(addedItem._id, {
            "Newspaper": "My New Paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 2,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        }, { returnNewDocument:true });

        const newAddedItemQuery = await circulationRepo.getById(addedItem._id);
        assert.deepStrictEqual(newAddedItemQuery.Newspaper, "My New Paper");

        //remove
        const removed = await circulationRepo.removed(addedItem._id);
        assert(removed);
        const deletedItem = await circulationRepo.removed(addedItem._id);
        console.log(deletedItem);

        //averageFinalists
        const averageFinalists = await circulationRepo.averageFinalists();
        console.log("Avg Finalists" + averageFinalists);

        //more Complex Aggregate Functions
        const avgByChange = await circulationRepo.averageFinalistsByChange();
        console.log(avgByChange);

    } catch (error) {
        //allows you to service the error but also clean up.
        console.log(error);
    } finally {
        const admin = client.db(dbName).admin();
        await client.db(dbName).dropDatabase();
        console.log(await admin.listDatabases());

        client.close();
    }
}

main();
