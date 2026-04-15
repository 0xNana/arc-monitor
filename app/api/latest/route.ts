import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { defaultLatestMetrics } from '@/lib/monitorData'

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'latest.json')
  
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(defaultLatestMetrics)
  }
}
