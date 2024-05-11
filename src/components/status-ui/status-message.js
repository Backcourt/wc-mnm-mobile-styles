export default function StatusMessage( { messages } )
{
    if (messages.length === 0 ) {
        return null;
    }

    return (
    <div className="mnm_message">
    <ul
                aria-live="polite"
                role="status"
                className="msg mnm_message_content"
    >
                { messages.map(
                    ( message, index ) => (
                    <li key={ index }>{ message }</li>
                    ) 
                ) }
    </ul>
    </div>
    );
}
