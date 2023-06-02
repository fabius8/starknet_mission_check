const puppeteer = require('puppeteer');

const fs = require('fs');

addrFile = 'layerswap_addresses.txt'
layerSwapAddress = "0x019252b1deef483477c4d30cfcc3e5ed9c82fafea44669c182a45a01b4fdb97a"
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
            'query': 'query ERC20TransferEventsTableQuery(\n  $first: Int!\n  $after: String\n  $input: ERC20TransferEventsInput!\n) {\n  ...ERC20TransferEventsTablePaginationFragment_erc20TransferEvents_2DAjA4\n}\n\nfragment ERC20TransferEventsTablePaginationFragment_erc20TransferEvents_2DAjA4 on Query {\n  erc20TransferEvents(first: $first, after: $after, input: $input) {\n    edges {\n      node {\n        id\n        ...ERC20TransferEventsTableRowFragment_erc20TransferEvent\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment ERC20TransferEventsTableRowFragment_erc20TransferEvent on ERC20TransferEvent {\n  id\n  transaction_hash\n  from_address\n  from_erc20_identifier\n  from_contract {\n    is_social_verified\n    id\n  }\n  transfer_from_address\n  transfer_from_identifier\n  transfer_from_contract {\n    is_social_verified\n    id\n  }\n  transfer_to_address\n  transfer_to_identifier\n  transfer_to_contract {\n    is_social_verified\n    id\n  }\n  transfer_amount\n  transfer_amount_display\n  timestamp\n  main_call {\n    selector_identifier\n    id\n  }\n}\n',
            'variables': {
                'first': 30,
                'after': null,
                'input': {
                    "transfer_from_or_to_address": address,
                    "call_invocation_type": "FUNCTION",
                    "sort_by": "timestamp",
                    "order_by": "desc"
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
        tx = response['data']['erc20TransferEvents']['edges']
        //console.log(tx)
        let find = 0
        //console.log(tx.length)
        for(let i = 0; i < tx.length; i++){
            if (tx[i]['node']['transfer_from_address'] && (layerSwapAddress == tx[i]['node']['transfer_from_address'])){
                console.log("已经使用layerswap交易过！", tx[i]['node']['transfer_from_address'])
                find = 1
            }
        }
        if (find == 0){
            console.log("❌ 失败!")
        }
        else{
            console.log("🍺 成功!")
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
            console.log("\n")
            await sleep(1*1000)
        }
        catch(e){
            console.log(e.message)
        }
    }
    await browser.close()
}

batchGetStarkInfo()
