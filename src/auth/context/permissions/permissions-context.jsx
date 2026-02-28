import React, { useContext } from 'react'
import { AuthContext } from 'src/auth/context/jwt';

const PermissionsContext = ({ children, action, isList, mustAll }) => {
    const { user } = useContext(AuthContext);
    const actions = user?.roles?.flatMap(role => role?.permissions?.map(permission => permission?.key));
    return (
        <>

            {
                children
            }


            {/* {
                !action ||
                    (Array.isArray(action)
                        ? action.some(a => actions?.includes(a))
                        : actions?.includes(action))
                    ?
                    children
                    : null
            } */}

        </>
    )
}

export default PermissionsContext