// app/api/tickets/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1', // Replace with your AWS region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // Ensure these environment variables are set
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'Tickets';

// Handle GET requests - Fetch all tickets
export async function GET(request: NextRequest) {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    return NextResponse.json(data.Items);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// Handle POST requests - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTicket = {
      ...body,
      arNumber: `${Date.now()}`, // Generate a unique AR number
      dateCreated: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: newTicket,
    };

    await dynamoDb.put(params).promise();
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
