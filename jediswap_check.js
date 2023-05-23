const puppeteer = require('puppeteer');

const fs = require('fs');

addrFile = 'addresses.txt'
const data = fs.readFileSync(addrFile, 'utf8');
const data_array = data.split("\n");
const keyPairs = [];
data_array.forEach(line => {
    const [address] = line.trim().split(/[\t ]+/);
    keyPairs.push({ address });
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStarkInfo(page, address) {
    try {


        const url = "https://starkscan.stellate.sh/";
        const headers = {
            'authority': "starkscan.stellate.sh",
            'accept': "application/json",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "content-type": "application/json",
        };
        const Json_data = {
            'query': 'query TransactionsTableQuery(\n  $first: Int!\n  $after: String\n  $input: TransactionsInput!\n) {\n  ...TransactionsTablePaginationFragment_transactions_2DAjA4\n}\n\nfragment TransactionsTableExpandedItemFragment_transaction on Transaction {\n  entry_point_selector_name\n  calldata_decoded\n  entry_point_selector\n  calldata\n  initiator_address\n  initiator_identifier\n  main_calls {\n    selector\n    selector_name\n    calldata_decoded\n    selector_identifier\n    calldata\n    contract_address\n    contract_identifier\n    id\n  }\n}\n\nfragment TransactionsTablePaginationFragment_transactions_2DAjA4 on Query {\n  transactions(first: $first, after: $after, input: $input) {\n    edges {\n      node {\n        id\n        ...TransactionsTableRowFragment_transaction\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment TransactionsTableRowFragment_transaction on Transaction {\n  id\n  transaction_hash\n  block_number\n  transaction_status\n  transaction_type\n  timestamp\n  initiator_address\n  initiator_identifier\n  initiator {\n    is_social_verified\n    id\n  }\n  main_calls {\n    selector_identifier\n    id\n  }\n  ...TransactionsTableExpandedItemFragment_transaction\n}\n',
            'variables': {
                'first': 30,
                'after': null,
                'input': {
                    'initiator_address': address,
                    'transaction_types': [
                        'INVOKE_FUNCTION'
                    ],
                    'sort_by': 'timestamp',
                    'order_by': 'desc',
                    'min_block_number': null,
                    'max_block_number': null,
                    'min_timestamp': null,
                    'max_timestamp': null
                }
            }
        }
        
        const response = await page.evaluate(async (url, headers, Json_data) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(Json_data)
            });
            return response.json();
        }, url, headers, Json_data);
        tx = response['data']['transactions']['edges']
        //console.log(tx)
        let find = 0
        //console.log(tx.length)
        for(let i = 0; i < tx.length; i++){
            main_calls = tx[i]['node']['main_calls']
            if(main_calls){
                for(let j = 0; j < main_calls.length; j++){
                    //console.log(main_calls[j]['selector_identifier'])
                    if(main_calls[j]['selector_identifier'] == "swap_exact_tokens_for_tokens") {
                        console.log(main_calls[j]['selector_identifier'], "🍺 成功!")
                        find = 1
                        return
                    }
                }
            }
        }
        if (find == 0){
            console.log(address, "❌ 失败!")
        }
    } catch (e) {
        console.log(e)
    }
}

async function batchGetStarkInfo(){
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    for(let i = 0; i < keyPairs.length; i++){
        const accountAddress = keyPairs[i].address;
        //const index = keyPairs[i].index
        try{
            console.log("第", i, "个...", "地址:", accountAddress)
            await getStarkInfo(page, accountAddress)
            await sleep(1*1000)
        }
        catch(e){
            console.log(e.message)
        }
    }
}

batchGetStarkInfo()
