import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  TextField,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import '@fontsource/roboto';
import ClickableUserName from './ClickableUserName';
import config from '../config/config';

const UserList = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [customRoles, setCustomRoles] = useState({});
  const [updatingUsers, setUpdatingUsers] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/requests/allusers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (Array.isArray(data.requests)) {
        setUsers(data.requests);
        const roles = {};
        const custom = {};
        data.requests.forEach((user) => {
          roles[user._id] = user.role || '';
          custom[user._id] = '';
        });
        setSelectedRoles(roles);
        setCustomRoles(custom);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, role) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
    if (role !== 'custom') {
      setCustomRoles((prev) => ({ ...prev, [userId]: '' }));
    }
  };

  const updateUserRole = async (userId) => {
    if (!token) return;
    setUpdatingUsers((prev) => ({ ...prev, [userId]: true }));
    const role = selectedRoles[userId] === 'custom' ? customRoles[userId] : selectedRoles[userId];

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
        fetchUsers();
      } else {
        throw new Error(result.message || 'Failed to update role');
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setUpdatingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Box p={4} fontFamily="Roboto">
      <Typography variant="h4" gutterBottom>
        User Role Management
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Current Role</strong></TableCell>
                <TableCell><strong>Assign Role</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <ClickableUserName userId={user._id} userName={user.name} />
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role || <em>No role</em>}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <FormControl size="small" style={{ minWidth: 150 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={selectedRoles[user._id] || ''}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          label="Role"
                        >
                          <MenuItem value="">Select role</MenuItem>
                          {config.availableRoles.map((role) => (
                            <MenuItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {selectedRoles[user._id] === 'custom' && (
                        <TextField
                          size="small"
                          placeholder="Enter custom role"
                          value={customRoles[user._id] || ''}
                          onChange={(e) =>
                            setCustomRoles((prev) => ({ ...prev, [user._id]: e.target.value }))
                          }
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={updatingUsers[user._id]}
                      onClick={() => updateUserRole(user._id)}
                    >
                      {updatingUsers[user._id] ? 'Updating...' : 'Update Role'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default UserList;
