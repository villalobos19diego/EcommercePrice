import { connect } from "http2";
import { NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const revalidate = 0;





export async function GET(request: Request) {


    try{
        connectToDB();
    
    
    const products = await  Product.find({});

if(!products) throw new Error("No Product fetchend");



const updateProducts = await Promise.all(
    products.map(async (currentProduct) => {

        const scrapeProduct = await scrapeAmazonProduct(currentProduct.url);

        if(!scrapeProduct)return;


        const updatePriceHistory  = [


            ...currentProduct.PriceHistory,

            {
                price : scrapeProduct.currentPrice,
            },
        ];

const product = {
    ...scrapeProduct,
    PriceHistory:  updatePriceHistory,
    lowestPrice : getLowesPrice(updatePriceHistory),
    highesPrice: getHighestPrice(updatePriceHistory),
    averangePrice: getAvaragePrice(updatePriceHistory),
};

const updateProduct = await product.findOneAndUpdate(

    {
        url: product.url,
    },

    product

);



const EmailNotifType = getEmailNotifType(
    scrapeProduct,
    currentProduct
);



if(EmailNotifType && updateProduct.users.length > 0){
    const productInfo = {title : updateProduct.title,
    url: updateProduct.url,};





    const emailContent = await generateEmailBody(productInfo, EmailNotifType);


    const userEmails = updateProduct.users.map((user: any) => user.email);



    await sendEmail(emailContent, userEmails);




}


return updateProduct;


    })
);


return NextResponse.json({message:"OK",
data: updateProducts,});

    }catch(error: any){
        throw new Error(`failed to get all products: ${error.message}`);
    } 
    
}