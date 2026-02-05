import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking votes table columns...')
    const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .limit(1)

    if (votesError) {
        console.error('Error fetching from votes:', votesError)
    } else {
        console.log('Votes columns sample keys:', Object.keys(votesData[0] || {}))
    }

    console.log('\nChecking results table columns...')
    const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('*')
        .limit(1)

    if (resultsError) {
        console.error('Error fetching from results:', resultsError)
    } else {
        console.log('Results columns sample keys:', Object.keys(resultsData[0] || {}))
    }

    console.log('\nChecking if increment_poll_result RPC exists...')
    // Attempting to call with dummy data just to see if it exists
    const { error: rpcError } = await supabase.rpc('increment_poll_result', {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_question: 'test',
        p_friend_id: null,
        p_answer_option: null
    })

    if (rpcError && rpcError.code === 'PGRST202') {
        console.log('RPC increment_poll_result DOES NOT EXIST (404)')
    } else if (rpcError) {
        console.log('RPC exists but failed (expectedly):', rpcError.message)
    } else {
        console.log('RPC exists and succeeded with dummy data!')
    }
}

checkSchema()
